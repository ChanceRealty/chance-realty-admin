// src/app/api/media/upload/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { imagekit } from '@/lib/imagekit'
import { sql } from '@vercel/postgres'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

export async function POST(request: Request) {
	try {
		// Verify admin authentication
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

		const formData = await request.formData()
		const file = formData.get('file') as File
		const propertyId = formData.get('propertyId') as string
		const isPrimary = formData.get('isPrimary') === 'true'
		const displayOrder = parseInt(
			(formData.get('displayOrder') as string) || '0'
		)

		if (!file || !propertyId) {
			return NextResponse.json(
				{ error: 'File and propertyId are required' },
				{ status: 400 }
			)
		}

		// Determine media type
		const fileType = file.type.startsWith('video/') ? 'video' : 'image'

		// Create a folder path based on propertyId
		const folderPath = `/properties/${propertyId}`

		// Convert file to buffer for upload
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Upload to ImageKit
		const uploadResponse = await imagekit.upload({
			file: buffer,
			fileName: file.name,
			folder: folderPath,
			useUniqueFileName: true,
		})

		// Start a transaction
		await sql.query('BEGIN')

		try {
			// If this is the primary media and it's an image, update any existing primary images to non-primary
			if (isPrimary && fileType === 'image') {
				await sql`
          UPDATE property_media 
          SET is_primary = false 
          WHERE property_id = ${parseInt(
						propertyId
					)} AND is_primary = true AND type = 'image'
        `
			}

			// Save media info to database
			const result = await sql`
        INSERT INTO property_media (
          property_id, file_id, url, thumbnail_url, type, is_primary, display_order
        ) VALUES (
          ${parseInt(propertyId)},
          ${uploadResponse.fileId},
          ${uploadResponse.url},
          ${uploadResponse.thumbnailUrl},
          ${fileType},
          ${isPrimary},
          ${displayOrder}
        )
        RETURNING id
      `

			// Commit transaction
			await sql.query('COMMIT')

			return NextResponse.json({
				success: true,
				id: result.rows[0].id,
				...uploadResponse,
				type: fileType,
				isPrimary,
				displayOrder,
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Media upload error:', error)
		return NextResponse.json(
			{ error: 'Failed to upload media' },
			{ status: 500 }
		)
	}
}
