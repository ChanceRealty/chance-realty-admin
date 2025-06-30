import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
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

const mockImagekit = {
	deleteFile: async (fileId: string) => {
	  console.log(`Mock delete file: ${fileId}`)
	  return { message: 'File deleted' }
	}
  }
  
  // Try to import imagekit, but fall back to mock if it fails
  let imagekit: any
  try {
	// Import the real imagekit if environment variables are available
	if (process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY && 
		process.env.IMAGEKIT_PRIVATE_KEY && 
		process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
	  const { imagekit: realImagekit } = require('@/lib/imagekit')
	  imagekit = realImagekit
	} else {
	  console.warn('ImageKit credentials not found, using mock implementation')
	  imagekit = mockImagekit
	}
  } catch (error) {
	console.warn('Error initializing ImageKit, using mock implementation:', error)
	imagekit = mockImagekit
  }


// src/app/api/media/[id]/route.ts - Fix the DELETE function
export async function DELETE(
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
}

