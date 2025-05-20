import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { imagekit } from '@/lib/imagekit'
import { sql } from '@vercel/postgres'

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

// Using type assertion to bypass the type error
export const DELETE = (async (
	request: NextRequest,
	context: { params: { id: string } }
) => {
	try {
		const { params } = context
		
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

		const mediaId = parseInt(params.id)
		if (isNaN(mediaId)) {
			return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
		}

		const mediaResult = await sql`
			SELECT * FROM property_media WHERE id = ${mediaId}
		`
		if (mediaResult.rows.length === 0) {
			return NextResponse.json({ error: 'Media not found' }, { status: 404 })
		}

		const media = mediaResult.rows[0]
		await sql.query('BEGIN')
		try {
			await imagekit.deleteFile(media.file_id)
			await sql`DELETE FROM property_media WHERE id = ${mediaId}`
			
			if (media.is_primary && media.type === 'image') {
				const firstImageResult = await sql`
					SELECT id FROM property_media 
					WHERE property_id = ${media.property_id} AND type = 'image'
					ORDER BY display_order, created_at
					LIMIT 1
				`
				if (firstImageResult.rows.length > 0) {
					await sql`
						UPDATE property_media 
						SET is_primary = true 
						WHERE id = ${firstImageResult.rows[0].id}
					`
				}
			}
			
			await sql.query('COMMIT')
			return NextResponse.json({ success: true })
		} catch (error) {
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Error deleting media:', error)
		return NextResponse.json(
			{ error: 'Failed to delete media' },
			{ status: 500 }
		)
	}
}) as any // Type assertion to bypass type checking