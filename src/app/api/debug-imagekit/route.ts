// src/app/api/debug-imagekit/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET() {
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

		// Check environment variables
		const envVars = {
			publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
			privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
			urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
		}

		const envCheck = {
			publicKey: {
				exists: !!envVars.publicKey,
				length: envVars.publicKey?.length || 0,
				preview: envVars.publicKey?.substring(0, 30) + '...',
				startsWithPublic: envVars.publicKey?.startsWith('public_') || false,
				hasWhitespace: envVars.publicKey !== envVars.publicKey?.trim(),
				actualValue: envVars.publicKey, // ONLY for debugging - remove in production
			},
			privateKey: {
				exists: !!envVars.privateKey,
				length: envVars.privateKey?.length || 0,
				preview: envVars.privateKey?.substring(0, 30) + '...',
				startsWithPrivate: envVars.privateKey?.startsWith('private_') || false,
				hasWhitespace: envVars.privateKey !== envVars.privateKey?.trim(),
				actualValue: envVars.privateKey, // ONLY for debugging - remove in production
			},
			urlEndpoint: {
				exists: !!envVars.urlEndpoint,
				value: envVars.urlEndpoint,
				isValidFormat:
					envVars.urlEndpoint?.startsWith('https://ik.imagekit.io/') || false,
				hasWhitespace: envVars.urlEndpoint !== envVars.urlEndpoint?.trim(),
			},
		}

		// Test ImageKit connection with multiple approaches
		let basicTest: { success: boolean; error?: string; message?: string } = { success: false, error: 'Not tested' }
		let authTest: {
			success: boolean
			error?: string
			token?: string
			expire?: number
			signature?: string
			details?: unknown
		} = { success: false, error: 'Not tested' }
		let listTest: {
			success: boolean
			error?: string
			message?: string
			sampleFile?: {
				fileId: string
				name: string
				url: string
			} | null
			details?: unknown
		} = { success: false, error: 'Not tested' }

		try {
			// Method 1: Test basic ImageKit import and instantiation
			const ImageKit = (await import('imagekit')).default

			const imagekit = new ImageKit({
				publicKey: envVars.publicKey?.trim() || '',
				privateKey: envVars.privateKey?.trim() || '',
				urlEndpoint: envVars.urlEndpoint?.trim() || '',
			})

			basicTest = {
				success: true,
				message: 'ImageKit instance created successfully',
			}

			// Method 2: Test authentication parameters generation
			try {
				const authParams = imagekit.getAuthenticationParameters()
				authTest = {
					success: true,
					token: authParams.token?.substring(0, 30) + '...',
					expire: authParams.expire,
					signature: authParams.signature?.substring(0, 30) + '...',
				}
			} catch (authError) {
				authTest = {
					success: false,
					error:
						authError instanceof Error
							? authError.message
							: 'Unknown auth error',
					details: authError,
				}
			}

			// Method 3: Test actual API call (list files)
			try {
				const files = await imagekit.listFiles({ limit: 1 })
				listTest = {
					success: true,
					message: `API call successful! Found ${files.length} files`,
					sampleFile:
						files[0] && 'fileId' in files[0]
							? {
									fileId: (files[0] as any).fileId,
									name: (files[0] as any).name,
									url: (files[0] as any).url,
							  }
							: null,
				}
			} catch (listError) {
				listTest = {
					success: false,
					error:
						listError instanceof Error
							? listError.message
							: 'Unknown list error',
					details: listError,
				}
			}
		} catch (importError) {
			basicTest = {
				success: false,
				error: `ImageKit import/instantiation failed: ${
					importError instanceof Error ? importError.message : 'Unknown error'
				}`,
			}
		}

		// Generate specific recommendations
		const issues = []
		const recommendations = []

		if (!envCheck.publicKey.exists) {
			issues.push('Missing NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY')
			recommendations.push(
				'Add NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY to your .env.local file'
			)
		} else {
			if (!envCheck.publicKey.startsWithPublic) {
				issues.push('Public key format incorrect')
				recommendations.push('Public key should start with "public_"')
			}
			if (envCheck.publicKey.hasWhitespace) {
				issues.push('Public key has whitespace')
				recommendations.push('Remove leading/trailing spaces from public key')
			}
			if (envCheck.publicKey.length < 20) {
				issues.push('Public key seems too short')
				recommendations.push('Verify you copied the complete public key')
			}
		}

		if (!envCheck.privateKey.exists) {
			issues.push('Missing IMAGEKIT_PRIVATE_KEY')
			recommendations.push('Add IMAGEKIT_PRIVATE_KEY to your .env.local file')
		} else {
			if (!envCheck.privateKey.startsWithPrivate) {
				issues.push('Private key format incorrect')
				recommendations.push('Private key should start with "private_"')
			}
			if (envCheck.privateKey.hasWhitespace) {
				issues.push('Private key has whitespace')
				recommendations.push('Remove leading/trailing spaces from private key')
			}
			if (envCheck.privateKey.length < 20) {
				issues.push('Private key seems too short')
				recommendations.push('Verify you copied the complete private key')
			}
		}

		if (!envCheck.urlEndpoint.exists) {
			issues.push('Missing NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT')
			recommendations.push(
				'Add NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT to your .env.local file'
			)
		} else {
			if (!envCheck.urlEndpoint.isValidFormat) {
				issues.push('URL endpoint format incorrect')
				recommendations.push(
					'URL endpoint should be like: https://ik.imagekit.io/your_id'
				)
			}
			if (envCheck.urlEndpoint.hasWhitespace) {
				issues.push('URL endpoint has whitespace')
				recommendations.push('Remove leading/trailing spaces from URL endpoint')
			}
		}

		return NextResponse.json({
			summary: {
				totalIssues: issues.length,
				canAuthenticate: authTest.success,
				canCallAPI: listTest.success,
				overallStatus:
					issues.length === 0 && authTest.success && listTest.success
						? 'WORKING'
						: 'BROKEN',
			},
			environment: envCheck,
			tests: {
				basicInstantiation: basicTest,
				authenticationGeneration: authTest,
				apiCall: listTest,
			},
			issues: issues,
			recommendations: recommendations,
			nextSteps: generateNextSteps(issues, authTest, listTest),
		})
	} catch (error) {
		return NextResponse.json(
			{
				error: 'Debug endpoint failed',
				details: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		)
	}
}

function generateNextSteps(issues: string[], authTest: any, listTest: any) {
	if (issues.length > 0) {
		return [
			'1. Fix the environment variable issues listed above',
			'2. Restart your Next.js development server',
			'3. Test this endpoint again',
			'4. If still not working, verify credentials in ImageKit dashboard',
		]
	} else if (!authTest.success) {
		return [
			'1. Double-check your ImageKit credentials in the dashboard',
			'2. Make sure your ImageKit account is not suspended',
			'3. Try generating new API keys',
			"4. Verify you're using the correct ImageKit account",
		]
	} else if (!listTest.success) {
		return [
			'1. Check your ImageKit account status',
			'2. Verify API permissions in ImageKit dashboard',
			'3. Check if there are any IP restrictions',
			'4. Try the ImageKit API directly with a tool like Postman',
		]
	} else {
		return [
			'✅ Everything looks good!',
			'ImageKit should be working correctly.',
			"If you're still having issues, the problem might be elsewhere.",
		]
	}
}
