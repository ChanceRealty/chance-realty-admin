// src/app/api/media/[id]/primary/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query, transaction } from '@/lib/db'

// src/app/api/media/[id]/primary/route.ts - Fix the PUT function
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// ✅ FIX: Await the params object
		const { id } = await params

		const cookieStore = await cookies()
		const token = cookieStore.get('token')?.value

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

		const mediaId = parseInt(id)
		if (isNaN(mediaId)) {
			return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
		}

		// Get the media item to check if it's an image and get property_id
		const mediaResult = await query(
			'SELECT property_id, type FROM property_media WHERE id = $1',
			[mediaId]
		)

		if (mediaResult.rows.length === 0) {
			return NextResponse.json({ error: 'Media not found' }, { status: 404 })
		}

		const media = mediaResult.rows[0]

		if (media.type !== 'image') {
			return NextResponse.json(
				{ error: 'Only images can be set as primary' },
				{ status: 400 }
			)
		}

		await transaction(async client => {
			// Unset all existing primary images for this property
			await client.query(
				'UPDATE property_media SET is_primary = false WHERE property_id = $1 AND type = $2',
				[media.property_id, 'image']
			)

			// Set this image as primary
			await client.query(
				'UPDATE property_media SET is_primary = true WHERE id = $1',
				[mediaId]
			)
		})

		return NextResponse.json({
			success: true,
			message: 'Primary image updated successfully',
		})
	} catch (error) {
		console.error('Error updating primary image:', error)
		return NextResponse.json(
			{ error: 'Failed to update primary image' },
			{ status: 500 }
		)
	}
}
