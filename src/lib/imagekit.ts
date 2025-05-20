// src/lib/imagekit.ts
import ImageKit from 'imagekit'

// Initialize the ImageKit instance
const imageKitConfig = {
	publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
	urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
}

// Log configuration for debugging
console.log('ImageKit Config (redacted keys):', {
	publicKeyExists: !!imageKitConfig.publicKey,
	privateKeyExists: !!imageKitConfig.privateKey,
	urlEndpoint: imageKitConfig.urlEndpoint,
})

export const imagekit = new ImageKit(imageKitConfig)

// Function to generate authentication parameters for client-side uploads
export async function getAuthenticationParameters() {
	try {
		const token = imagekit.getAuthenticationParameters()
		return token
	} catch (error) {
		console.error('Error generating ImageKit auth parameters:', error)
		throw error
	}
}

// Define types for ImageKit responses
export interface ImageKitUploadResponse {
	fileId: string
	name: string
	url: string
	thumbnailUrl: string
	height: number
	width: number
	size: number
	filePath: string
	fileType: string
}

export interface PropertyMedia {
	id: string
	propertyId: number
	fileId: string
	url: string
	thumbnailUrl: string
	type: 'image' | 'video'
	isPrimary: boolean
	displayOrder: number
	createdAt: Date
}
