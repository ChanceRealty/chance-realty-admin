// src/app/api/admin/fix-video-thumbnails/route.ts
// Create this new file to fix existing videos

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

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

		console.log('🔧 Starting to fix video thumbnails...')

		// Get all video media items
		const result = await sql`
			SELECT id, url, thumbnail_url, type 
			FROM property_media 
			WHERE type = 'video'
		`

		console.log(`📊 Found ${result.rows.length} video items`)

		let fixedCount = 0
		let skippedCount = 0
		const errors = []

		for (const video of result.rows) {
			try {
				// Check if thumbnail needs fixing
				const needsFix =
					!video.thumbnail_url ||
					video.thumbnail_url === video.url ||
					video.thumbnail_url.trim() === ''

				if (needsFix && video.url.includes('ik.imagekit.io')) {
					// Generate proper thumbnail URL
					const baseUrl = video.url.split('?')[0]
					const thumbnailUrl = `${baseUrl}?tr=so-1.0,w-400,h-300,fo-auto,q-80`

					// Update the database
					await sql`
						UPDATE property_media 
						SET thumbnail_url = ${thumbnailUrl}
						WHERE id = ${video.id}
					`

					console.log(`✅ Fixed video ${video.id}`)
					fixedCount++
				} else {
					skippedCount++
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
			message: 'Video thumbnails fixed',
			stats: {
				total: result.rows.length,
				fixed: fixedCount,
				skipped: skippedCount,
				errors: errors.length,
			},
			errors: errors.length > 0 ? errors : undefined,
		})
	} catch (error) {
		console.error('❌ Error fixing video thumbnails:', error)
		return NextResponse.json(
			{
				error: 'Failed to fix video thumbnails',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
