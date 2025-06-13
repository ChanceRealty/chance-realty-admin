// src/app/api/admin/translations/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { translatePropertyData } from '@/lib/translateService'

// GET - Get translation status for properties
export async function GET(request: Request) {
	try {
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

		const { searchParams } = new URL(request.url)
		const propertyId = searchParams.get('propertyId')

		if (propertyId) {
			// Get translations for specific property
			const result = await sql`
				SELECT 
					p.id,
					p.title,
					p.title_ru,
					p.title_en,
					p.description,
					p.description_ru,
					p.description_en,
					p.translation_status,
					p.last_translated_at,
					p.translation_error
				FROM properties p
				WHERE p.id = ${parseInt(propertyId)}
			`

			if (result.rows.length === 0) {
				return NextResponse.json(
					{ error: 'Property not found' },
					{ status: 404 }
				)
			}

			// Get detailed translation history
			const translationHistory = await sql`
				SELECT 
					language_code,
					field_name,
					translated_text,
					translation_source,
					created_at,
					updated_at
				FROM property_translations
				WHERE property_id = ${parseInt(propertyId)}
				ORDER BY language_code, field_name, created_at DESC
			`

			return NextResponse.json({
				property: result.rows[0],
				translations: translationHistory.rows,
			})
		} else {
			// Get translation overview for all properties
			const result = await sql`
				SELECT 
					p.id,
					p.custom_id,
					p.title,
					p.translation_status,
					p.last_translated_at,
					CASE 
						WHEN p.title_ru IS NOT NULL AND p.title_en IS NOT NULL THEN 'complete'
						WHEN p.title_ru IS NOT NULL OR p.title_en IS NOT NULL THEN 'partial'
						ELSE 'none'
					END as translation_coverage,
					CASE 
						WHEN p.title_ru IS NOT NULL THEN true
						ELSE false
					END as has_russian,
					CASE 
						WHEN p.title_en IS NOT NULL THEN true
						ELSE false
					END as has_english
				FROM properties p
				ORDER BY p.created_at DESC
				LIMIT 100
			`

			return NextResponse.json(result.rows)
		}
	} catch (error) {
		console.error('Error fetching translations:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch translations' },
			{ status: 500 }
		)
	}
}

// POST - Retranslate property or batch translate
export async function POST(request: Request) {
	try {
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

		const { propertyId, propertyIds, action } = await request.json()

		if (action === 'retranslate' && propertyId) {
			// Retranslate single property
			return await retranslateProperty(propertyId)
		} else if (action === 'batch_translate' && propertyIds) {
			// Batch translate multiple properties
			return await batchTranslateProperties(propertyIds)
		} else if (action === 'translate_missing') {
			// Translate all properties missing translations
			return await translateMissingProperties()
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
	} catch (error) {
		console.error('Error in translation operation:', error)
		return NextResponse.json(
			{ error: 'Translation operation failed' },
			{ status: 500 }
		)
	}
}

async function retranslateProperty(propertyId: number) {
	try {
		// Get property data
		const propertyResult = await sql`
			SELECT title, description FROM properties WHERE id = ${propertyId}
		`

		if (propertyResult.rows.length === 0) {
			return NextResponse.json({ error: 'Property not found' }, { status: 404 })
		}

		const { title, description } = propertyResult.rows[0]

		// Update status to translating
		await sql`
			UPDATE properties 
			SET translation_status = 'translating', translation_error = NULL
			WHERE id = ${propertyId}
		`

		// Perform translation
		const translations = await translatePropertyData(title, description || '')

		// Update property with new translations
		await sql`
			UPDATE properties 
			SET 
				title_ru = ${translations.title_ru || null},
				title_en = ${translations.title_en || null},
				description_ru = ${translations.description_ru || null},
				description_en = ${translations.description_en || null},
				translation_status = ${translations.title_ru ? 'completed' : 'failed'},
				last_translated_at = CURRENT_TIMESTAMP,
				translation_error = ${
					translations.title_ru ? null : 'Translation service failed'
				}
			WHERE id = ${propertyId}
		`

		// Update translation records
		if (translations.title_ru) {
			await sql`
				INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
				VALUES (${propertyId}, 'ru', 'title', ${translations.title_ru}, 'google'),
				       (${propertyId}, 'ru', 'description', ${translations.description_ru}, 'google')
				ON CONFLICT (property_id, language_code, field_name)
				DO UPDATE SET 
					translated_text = EXCLUDED.translated_text,
					translation_source = EXCLUDED.translation_source,
					updated_at = CURRENT_TIMESTAMP
			`
		}

		if (translations.title_en) {
			await sql`
				INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
				VALUES (${propertyId}, 'en', 'title', ${translations.title_en}, 'google'),
				       (${propertyId}, 'en', 'description', ${translations.description_en}, 'google')
				ON CONFLICT (property_id, language_code, field_name)
				DO UPDATE SET 
					translated_text = EXCLUDED.translated_text,
					translation_source = EXCLUDED.translation_source,
					updated_at = CURRENT_TIMESTAMP
			`
		}

		return NextResponse.json({
			success: true,
			message: 'Property retranslated successfully',
			translations: {
				russian: !!translations.title_ru,
				english: !!translations.title_en,
			},
		})
	} catch (error) {
		// Update status to failed
		await sql`
			UPDATE properties 
			SET 
				translation_status = 'failed',
				translation_error = ${error instanceof Error ? error.message : 'Unknown error'}
			WHERE id = ${propertyId}
		`

		throw error
	}
}

async function batchTranslateProperties(propertyIds: number[]) {
	const results = []

	for (const propertyId of propertyIds) {
		try {
			const result = await retranslateProperty(propertyId)
			results.push({
				propertyId,
				success: true,
				result: await result.json(),
			})
		} catch (error) {
			results.push({
				propertyId,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	}

	const successCount = results.filter(r => r.success).length
	const failureCount = results.filter(r => !r.success).length

	return NextResponse.json({
		success: true,
		message: `Batch translation completed: ${successCount} successful, ${failureCount} failed`,
		results,
		summary: {
			total: propertyIds.length,
			successful: successCount,
			failed: failureCount,
		},
	})
}

async function translateMissingProperties() {
	try {
		// Get properties that need translation
		const propertiesResult = await sql`
			SELECT id, title, description
			FROM properties 
			WHERE (title_ru IS NULL OR title_en IS NULL) 
			AND translation_status != 'translating'
			ORDER BY created_at DESC
			LIMIT 50
		`

		const propertyIds = propertiesResult.rows.map(p => p.id)

		if (propertyIds.length === 0) {
			return NextResponse.json({
				success: true,
				message: 'No properties need translation',
				summary: { total: 0, successful: 0, failed: 0 },
			})
		}

		return await batchTranslateProperties(propertyIds)
	} catch (error) {
		throw error
	}
}

// src/app/api/admin/translations/[propertyId]/route.ts
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
		await sql`
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
		`

		// Update translation records with manual source
		if (title_ru) {
			await sql`
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
			`
		}

		if (title_en) {
			await sql`
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
			`
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
