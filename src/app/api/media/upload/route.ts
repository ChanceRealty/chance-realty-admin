// src/app/api/media/upload/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { imagekit } from '@/lib/imagekit'
import { transaction } from '@/lib/db'
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

		const mediaId = await transaction(async client => {
			// If this is the primary media and it's an image, update existing primary images
			if (isPrimary && fileType === 'image') {
				await client.query(
					'UPDATE property_media SET is_primary = false WHERE property_id = $1 AND is_primary = true AND type = $2',
					[parseInt(propertyId), 'image']
				)
			}

			// Save media info to database
			const result = await client.query(
				`INSERT INTO property_media (
					property_id, file_id, url, thumbnail_url, type, is_primary, display_order
				) VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id`,
				[
					parseInt(propertyId),
					uploadResponse.fileId,
					uploadResponse.url,
					uploadResponse.thumbnailUrl,
					fileType,
					isPrimary,
					displayOrder,
				]
			)

			return result.rows[0].id
		})

		return NextResponse.json({
			success: true,
			id: mediaId,
			...uploadResponse,
			type: fileType,
			isPrimary,
			displayOrder,
		})
	} catch (error) {
		console.error('Media upload error:', error)
		return NextResponse.json(
			{ error: 'Failed to upload media' },
			{ status: 500 }
		)
	}
}
