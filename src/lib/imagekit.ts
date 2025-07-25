// src/lib/imagekit.ts - Fixed version with better error handling
import ImageKit from 'imagekit'

// Validate environment variables
const validateConfig = () => {
	const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim()
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim()
	const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim()

	const issues = []

	if (!publicKey) {
		issues.push('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is missing')
	} else if (!publicKey.startsWith('public_')) {
		issues.push('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY should start with "public_"')
	}

	if (!privateKey) {
		issues.push('IMAGEKIT_PRIVATE_KEY is missing')
	} else if (!privateKey.startsWith('private_')) {
		issues.push('IMAGEKIT_PRIVATE_KEY should start with "private_"')
	}

	if (!urlEndpoint) {
		issues.push('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is missing')
	} else if (!urlEndpoint.startsWith('https://ik.imagekit.io/')) {
		issues.push(
			'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT should start with "https://ik.imagekit.io/"'
		)
	}

	return {
		isValid: issues.length === 0,
		issues,
		publicKey,
		privateKey,
		urlEndpoint,
	}
}

// Initialize the ImageKit instance with validation
const configValidation = validateConfig()

if (!configValidation.isValid) {
	console.error('❌ ImageKit Configuration Issues:')
	configValidation.issues.forEach(issue => console.error(`  - ${issue}`))
	console.error('Please check your .env.local file and restart the server.')
} else {
	console.log('✅ ImageKit configuration looks good!')
}

const imageKitConfig = {
	publicKey: configValidation.publicKey || '',
	privateKey: configValidation.privateKey || '',
	urlEndpoint: configValidation.urlEndpoint || '',
}

// Create ImageKit instance with error handling
let imagekit: ImageKit
try {
	imagekit = new ImageKit(imageKitConfig)
	console.log('✅ ImageKit instance created successfully')
} catch (error) {
	console.error('❌ Failed to create ImageKit instance:', error)
	throw new Error('ImageKit initialization failed')
}

export { imagekit }

// Function to generate authentication parameters for client-side uploads
export async function getAuthenticationParameters() {
	try {
		if (!configValidation.isValid) {
			throw new Error(
				`ImageKit configuration invalid: ${configValidation.issues.join(', ')}`
			)
		}

		const token = imagekit.getAuthenticationParameters()
		return token
	} catch (error) {
		console.error('Error generating ImageKit auth parameters:', error)
		throw error
	}
}


export async function uploadToImageKit(
	file: Buffer,
	fileName: string,
	folder?: string
): Promise<ImageKitUploadResponse> {
	try {
		console.log('🔄 Starting ImageKit upload:', fileName)
		console.log('📊 File size:', file.length, 'bytes')
		console.log('📁 Target folder:', folder)

		if (!configValidation.isValid) {
			console.error('❌ ImageKit config invalid:', configValidation.issues)
			throw new Error(
				`ImageKit configuration invalid: ${configValidation.issues.join(', ')}`
			)
		}

		// Test ImageKit connection before upload
		console.log('🔗 Testing ImageKit connection...')
		const connectionTest = await testImageKitConnection()
		if (!connectionTest.success) {
			console.error('❌ ImageKit connection test failed:', connectionTest.error)
			throw new Error(`ImageKit connection failed: ${connectionTest.error}`)
		}
		console.log('✅ ImageKit connection successful')

		// Determine if it's an image or video
		const isVideo = fileName.toLowerCase().match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)
		const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|avif)$/i)

		console.log('📄 File type detected:', isImage ? 'image' : isVideo ? 'video' : 'unknown')

		// Enhanced upload configuration with quality settings
		const uploadConfig: any = {
			file: file,
			fileName: fileName,
			folder: folder || '/properties',
			useUniqueFileName: true,
		}

		console.log('📤 Uploading to ImageKit with config:', {
			fileName: uploadConfig.fileName,
			folder: uploadConfig.folder,
			useUniqueFileName: uploadConfig.useUniqueFileName
		})

		const uploadResponse = await imagekit.upload(uploadConfig)

		console.log(`✅ Successfully uploaded ${fileName}:`, {
			fileId: uploadResponse.fileId,
			url: uploadResponse.url,
			size: uploadResponse.size,
		})

		return uploadResponse
	} catch (error) {
		console.error(`❌ Failed to upload ${fileName}:`, error)

		// Provide more specific error messages
		if (error instanceof Error) {
			console.error('Error details:', {
				message: error.message,
				stack: error.stack
			})
			
			if (error.message.includes('authenticate') || error.message.includes('401')) {
				throw new Error(
					`ImageKit authentication failed. Please check your credentials: ${error.message}`
				)
			} else if (error.message.includes('quota') || error.message.includes('limit')) {
				throw new Error(`ImageKit quota exceeded or file size too large: ${error.message}`)
			} else if (error.message.includes('network') || error.message.includes('timeout')) {
				throw new Error(
					`Network error while uploading to ImageKit: ${error.message}`
				)
			}
		}

		throw error
	}
}

// Function to test ImageKit connection
export async function testImageKitConnection() {
	try {
		if (!configValidation.isValid) {
			return {
				success: false,
				error: `Configuration invalid: ${configValidation.issues.join(', ')}`,
			}
		}

		// Test authentication
		const authParams = await imagekit.getAuthenticationParameters()

		// Test API connection by listing files
		const files = await imagekit.listFiles({ limit: 1 })

		return {
			success: true,
			message: 'ImageKit connection successful',
			authParams: {
				token: authParams.token?.substring(0, 20) + '...',
				expire: authParams.expire,
			},
			filesFound: files.length,
		}
	} catch (error) {
		console.error('ImageKit connection test failed:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		}
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
