export function generateVideoThumbnailUrlAlt(videoUrl: string): string {
	if (videoUrl.includes('ik.imagekit.io')) {
		// Parse the URL
		const url = new URL(videoUrl)
		const pathParts = url.pathname.split('/')
		const filename = pathParts[pathParts.length - 1]

		// Remove video extension
		const filenameWithoutExt = filename.replace(/\.(mp4|mov|avi|webm)$/i, '')

		// Create new path with .jpg and transformations
		const newPath =
			pathParts.slice(0, -1).join('/') +
			`/tr:so-1.0,w-400,h-300,q-80/${filenameWithoutExt}.jpg`

		const thumbnailUrl = `${url.protocol}//${url.host}${newPath}`

		console.log('Generated thumbnail URL (alt):', thumbnailUrl)
		return thumbnailUrl
	}

	return videoUrl
}

/**
 * Get video thumbnail with fallback options
 */
export function getVideoThumbnail(
	videoUrl: string,
	existingThumbnail?: string | null
): string {
	// If we already have a valid thumbnail that's different from video URL
	if (
		existingThumbnail &&
		existingThumbnail !== videoUrl &&
		!existingThumbnail.includes('.mp4') &&
		!existingThumbnail.includes('.mov') &&
		!existingThumbnail.includes('.webm')
	) {
		return existingThumbnail
	}

	// Try primary method first
	const thumbnail = generateVideoThumbnailUrlAlt(videoUrl)

	// If that doesn't work, try alternative
	if (thumbnail === videoUrl) {
		return generateVideoThumbnailUrlAlt(videoUrl)
	}

	return thumbnail
}
