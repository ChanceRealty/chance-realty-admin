// src/scripts/fixVideoThumbnails.ts
// Run this once to fix all existing videos in your database

import { sql } from '@vercel/postgres'

async function fixExistingVideoThumbnails() {
	try {
		console.log('🔧 Starting to fix video thumbnails...')

		// Get all video media items
		const result = await sql`
			SELECT id, url, thumbnail_url, type 
			FROM property_media 
			WHERE type = 'video'
		`

		console.log(`📊 Found ${result.rows.length} video items to fix`)

		let fixedCount = 0
		let skippedCount = 0

		for (const video of result.rows) {
			// Check if thumbnail is missing or same as video URL
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

				console.log(`✅ Fixed video ${video.id}: ${thumbnailUrl}`)
				fixedCount++
			} else {
				console.log(
					`⏭️ Skipped video ${video.id} (already has thumbnail or not ImageKit)`
				)
				skippedCount++
			}
		}

		console.log(`\n📊 Summary:`)
		console.log(`   ✅ Fixed: ${fixedCount}`)
		console.log(`   ⏭️ Skipped: ${skippedCount}`)
		console.log(`   📝 Total: ${result.rows.length}`)
		console.log(`\n🎉 Done!`)

		return {
			fixed: fixedCount,
			skipped: skippedCount,
			total: result.rows.length,
		}
	} catch (error) {
		console.error('❌ Error fixing video thumbnails:', error)
		throw error
	}
}

// Export for use in API route
export { fixExistingVideoThumbnails }

// If running directly
if (require.main === module) {
	fixExistingVideoThumbnails()
		.then(() => process.exit(0))
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}
