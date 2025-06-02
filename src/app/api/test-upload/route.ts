// src/app/api/test-upload/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

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

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 })
		}

		console.log(`Testing upload of: ${file.name} (${file.size} bytes)`)

		// Get environment variables
		const envVars = {
			publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim(),
			privateKey: process.env.IMAGEKIT_PRIVATE_KEY?.trim(),
			urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim(),
		}

		console.log('Environment check:', {
			publicKeyExists: !!envVars.publicKey,
			publicKeyLength: envVars.publicKey?.length,
			publicKeyPrefix: envVars.publicKey?.substring(0, 10),
			privateKeyExists: !!envVars.privateKey,
			privateKeyLength: envVars.privateKey?.length,
			privateKeyPrefix: envVars.privateKey?.substring(0, 10),
			urlEndpoint: envVars.urlEndpoint,
		})

		// Test ImageKit upload step by step
		let step = 'Import ImageKit'
		try {
			console.log(`Step: ${step}`)
			const ImageKit = (await import('imagekit')).default

			step = 'Create ImageKit instance'
			console.log(`Step: ${step}`)
			const imagekit = new ImageKit({
				publicKey: envVars.publicKey || '',
				privateKey: envVars.privateKey || '',
				urlEndpoint: envVars.urlEndpoint || '',
			})

			step = 'Test authentication'
			console.log(`Step: ${step}`)
			const authParams = imagekit.getAuthenticationParameters()
			console.log('Auth params generated:', {
				hasToken: !!authParams.token,
				hasExpire: !!authParams.expire,
				hasSignature: !!authParams.signature,
			})

			step = 'Convert file to buffer'
			console.log(`Step: ${step}`)
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)
			console.log(`File converted to buffer: ${buffer.length} bytes`)

			step = 'Upload to ImageKit'
			console.log(`Step: ${step}`)
			console.log('Upload parameters:', {
				fileName: file.name,
				fileSize: buffer.length,
				folder: '/test-uploads',
				useUniqueFileName: true,
			})

			const uploadResponse = await imagekit.upload({
				file: buffer,
				fileName: file.name,
				folder: '/test-uploads',
				useUniqueFileName: true,
			})

			console.log('✅ Upload successful!', {
				fileId: uploadResponse.fileId,
				url: uploadResponse.url,
				name: uploadResponse.name,
				size: uploadResponse.size,
			})

			return NextResponse.json({
				success: true,
				message: 'Upload successful!',
				uploadResponse: {
					fileId: uploadResponse.fileId,
					url: uploadResponse.url,
					name: uploadResponse.name,
					size: uploadResponse.size,
					width: uploadResponse.width,
					height: uploadResponse.height,
				},
				steps: ['Import', 'Instance', 'Auth', 'Buffer', 'Upload'].map(
					s => `✅ ${s}`
				),
			})
		} catch (error) {
			console.error(`❌ Failed at step: ${step}`, error)

			let errorDetails = 'Unknown error'
			if (error instanceof Error) {
				errorDetails = error.message
				console.error('Error stack:', error.stack)
			}

			return NextResponse.json(
				{
					success: false,
					error: `Failed at step: ${step}`,
					details: errorDetails,
					file: {
						name: file.name,
						size: file.size,
						type: file.type,
					},
					environment: {
						publicKeyExists: !!envVars.publicKey,
						privateKeyExists: !!envVars.privateKey,
						urlEndpointExists: !!envVars.urlEndpoint,
					},
				},
				{ status: 500 }
			)
		}
	} catch (error) {
		console.error('Test upload endpoint error:', error)
		return NextResponse.json(
			{
				error: 'Test upload failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
