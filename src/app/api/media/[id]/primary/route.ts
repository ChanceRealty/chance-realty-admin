// src/app/api/media/[id]/primary/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: mediaId } = await params

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

		const id = parseInt(mediaId)
		if (isNaN(id)) {
			return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
		}

		// Get the media item to check if it's an image and get property_id
		const mediaResult = await sql`
			SELECT property_id, type FROM property_media WHERE id = ${id}
		`

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

		// Start transaction
		await sql.query('BEGIN')

		try {
			// Unset all existing primary images for this property
			await sql`
				UPDATE property_media 
				SET is_primary = false 
				WHERE property_id = ${media.property_id} AND type = 'image'
			`

			// Set this image as primary
			await sql`
				UPDATE property_media 
				SET is_primary = true 
				WHERE id = ${id}
			`

			await sql.query('COMMIT')

			return NextResponse.json({
				success: true,
				message: 'Primary image updated successfully',
			})
		} catch (error) {
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Error updating primary image:', error)
		return NextResponse.json(
			{ error: 'Failed to update primary image' },
			{ status: 500 }
		)
	}
}
