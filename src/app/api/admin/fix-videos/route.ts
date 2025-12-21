import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

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

		console.log('🔧 Fixing all video thumbnails...')

		const result = await query(`
  			SELECT id, url, thumbnail_url, type 
  			FROM property_media 
  			WHERE type = 'video'
		`)

		console.log(`📊 Found ${result.rows.length} videos to fix`)

		let fixedCount = 0
		const errors = []
		const details = []

		for (const video of result.rows) {
			try {
				if (video.url.includes('ik.imagekit.io')) {
					const baseVideoUrl = video.url.split('?')[0]
					const newThumbnailUrl = `${baseVideoUrl}/ik-thumbnail.jpg?tr=so-1.0:w-400:h-300:q-80`

					await query(
						'UPDATE property_media SET thumbnail_url = $1 WHERE id = $2',
						[newThumbnailUrl, video.id]
					)

					details.push({
						id: video.id,
						old: video.thumbnail_url,
						new: newThumbnailUrl,
					})

					console.log(`✅ Fixed video ${video.id}`)
					fixedCount++
				}
			} catch (error) {
				console.error(`❌ Error fixing video ${video.id}:`, error)
				errors.push({
					videoId: video.id,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		}

		return NextResponse.json({
			success: true,
			message: `Successfully fixed ${fixedCount} video thumbnails!`,
			stats: {
				total: result.rows.length,
				fixed: fixedCount,
				errors: errors.length,
			},
			details: details.slice(0, 5), // Show first 5 examples
			errors,
		})
	} catch (error) {
		console.error('❌ Error:', error)
		return NextResponse.json(
			{
				error: 'Failed to fix video thumbnails',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

export async function GET(request: Request) {
	return POST(request)
}
