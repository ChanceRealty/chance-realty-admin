import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ propertyId: string }> }
) {
	try {
		const { propertyId } = await params
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		const { title_ru, title_en, description_ru, description_en } =
			await request.json()

		// Manual translation update
		await query(`
			UPDATE properties 
			SET 
				title_ru = ${title_ru || null},
				title_en = ${title_en || null},
				description_ru = ${description_ru || null},
				description_en = ${description_en || null},
				translation_status = 'completed',
				last_translated_at = CURRENT_TIMESTAMP,
				translation_error = NULL
			WHERE id = ${parseInt(propertyId)}
		`)

		// Update translation records with manual source
		if (title_ru) {
			await query(`
				INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
				VALUES (${parseInt(propertyId)}, 'ru', 'title', ${title_ru}, 'manual'),
				       (${parseInt(propertyId)}, 'ru', 'description', ${
				description_ru || ''
			}, 'manual')
				ON CONFLICT (property_id, language_code, field_name)
				DO UPDATE SET 
					translated_text = EXCLUDED.translated_text,
					translation_source = 'manual',
					updated_at = CURRENT_TIMESTAMP
			`)
		}

		if (title_en) {
			await query(`
				INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
				VALUES (${parseInt(propertyId)}, 'en', 'title', ${title_en}, 'manual'),
				       (${parseInt(propertyId)}, 'en', 'description', ${
				description_en || ''
			}, 'manual')
				ON CONFLICT (property_id, language_code, field_name)
				DO UPDATE SET 
					translated_text = EXCLUDED.translated_text,
					translation_source = 'manual',
					updated_at = CURRENT_TIMESTAMP
			`)
		}

		return NextResponse.json({
			success: true,
			message: 'Translations updated manually',
		})
	} catch (error) {
		console.error('Error updating translations:', error)
		return NextResponse.json(
			{ error: 'Failed to update translations' },
			{ status: 500 }
		)
	}
}
