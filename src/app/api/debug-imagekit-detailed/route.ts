// src/app/api/debug-imagekit-detailed/route.ts
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

		// Get and analyze environment variables
		const envVars = {
			publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim(),
			privateKey: process.env.IMAGEKIT_PRIVATE_KEY?.trim(),
			urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim(),
		}

		console.log('=== DETAILED IMAGEKIT DEBUG ===')
		console.log('Public Key Analysis:')
		console.log('- Exists:', !!envVars.publicKey)
		console.log('- Length:', envVars.publicKey?.length)
		console.log('- First 20 chars:', envVars.publicKey?.substring(0, 20))
		console.log('- Last 10 chars:', envVars.publicKey?.substring(-10))
		console.log(
			'- Starts with public_:',
			envVars.publicKey?.startsWith('public_')
		)

		console.log('Private Key Analysis:')
		console.log('- Exists:', !!envVars.privateKey)
		console.log('- Length:', envVars.privateKey?.length)
		console.log('- First 20 chars:', envVars.privateKey?.substring(0, 20))
		console.log('- Last 10 chars:', envVars.privateKey?.substring(-10))
		console.log(
			'- Starts with private_:',
			envVars.privateKey?.startsWith('private_')
		)

		console.log('URL Endpoint:', envVars.urlEndpoint)

		// Test different ImageKit operations step by step
		const tests = {
			import: { success: false, error: 'Not tested' as string | undefined, message: undefined as string | undefined },
			instantiation: { success: false, error: 'Not tested' as string | undefined, message: undefined as string | undefined },
			authentication: { 
				success: false, 
				error: 'Not tested' as string | undefined, 
				token: undefined as string | undefined, 
				expire: undefined as number | undefined, 
				signature: undefined as string | undefined 
			},
			listFiles: { 
				success: false, 
				error: 'Not tested' as string | undefined, 
				message: undefined as string | undefined, 
				sample: undefined as any,
				details: undefined as any
			},
			uploadAuth: { 
				success: false, 
				error: 'Not tested' as string | undefined, 
				message: undefined as string | undefined,
				isAuthError: undefined as boolean | undefined,
				isQuotaError: undefined as boolean | undefined,
				isNetworkError: undefined as boolean | undefined,
				details: undefined as any
			},
		}

		try {
			// Test 1: Import ImageKit
			console.log('Test 1: Import ImageKit')
			const ImageKit = (await import('imagekit')).default
			tests.import = { success: true, error: undefined, message: 'Import successful' }

			// Test 2: Create instance
			console.log('Test 2: Create ImageKit instance')
			const imagekit = new ImageKit({
				publicKey: envVars.publicKey || '',
				privateKey: envVars.privateKey || '',
				urlEndpoint: envVars.urlEndpoint || '',
			})
			tests.instantiation = { success: true, error: undefined, message: 'Instance created' }

			// Test 3: Generate auth parameters
			console.log('Test 3: Generate auth parameters')
			const authParams = imagekit.getAuthenticationParameters()
			tests.authentication = {
				success: true,
				error: '',
				token: authParams.token?.substring(0, 30) + '...',
				expire: authParams.expire,
				signature: authParams.signature?.substring(0, 30) + '...',
			}

			// Test 4: List files (this tests if credentials work for API calls)
			console.log('Test 4: List files')
			try {
				const files = await imagekit.listFiles({ limit: 1 })
				tests.listFiles = {
					success: true,
					error: undefined,
					message: `Found ${files.length} files`,
					sample: files[0]
						? ('fileId' in files[0]
								? {
										fileId: (files[0] as any).fileId?.substring(0, 20) + '...',
										name: files[0].name,
								  }
								: {
										name: files[0].name,
								  })
						: null,
					details: files,
				}
			} catch (listError) {
				tests.listFiles = {
					success: false,
					error:
						listError instanceof Error
							? listError.message
							: 'Unknown list error',
					message: undefined,
					sample: undefined,
					details: listError,
				}
			}

			// Test 5: Test upload authentication specifically
			console.log('Test 5: Test upload auth')
			try {
				// Create a small test buffer
				const testBuffer = Buffer.from('test file content', 'utf8')

				// This should fail at authentication, not at file processing
				await imagekit.upload({
					file: testBuffer,
					fileName: 'auth-test.txt',
					folder: '/debug-test',
				})

				tests.uploadAuth = {
					success: true,
					error: undefined,
					message: 'Upload auth works (test file uploaded)',
					isAuthError: false,
					isQuotaError: false,
					isNetworkError: false,
					details: undefined,
				}
			} catch (uploadError) {
				const errorMessage =
					uploadError instanceof Error
						? uploadError.message
						: 'Unknown upload error'
				tests.uploadAuth = {
					success: false,
					error: errorMessage,
					message: undefined,
					isAuthError: errorMessage.includes('authenticate'),
					isQuotaError:
						errorMessage.includes('quota') || errorMessage.includes('limit'),
					isNetworkError:
						errorMessage.includes('network') ||
						errorMessage.includes('timeout'),
					details: uploadError,
				}
			}
		} catch (error) {
			console.error('Test failed:', error)
		}

		// Analyze results and provide specific guidance
		const analysis = analyzeResults(tests, envVars)

		return NextResponse.json({
			environment: {
				publicKey: {
					exists: !!envVars.publicKey,
					length: envVars.publicKey?.length,
					format: envVars.publicKey?.startsWith('public_')
						? 'correct'
						: 'incorrect',
					preview: envVars.publicKey?.substring(0, 50) + '...',
				},
				privateKey: {
					exists: !!envVars.privateKey,
					length: envVars.privateKey?.length,
					format: envVars.privateKey?.startsWith('private_')
						? 'correct'
						: 'incorrect',
					preview: envVars.privateKey?.substring(0, 50) + '...',
				},
				urlEndpoint: {
					value: envVars.urlEndpoint,
					format: envVars.urlEndpoint?.startsWith('https://ik.imagekit.io/')
						? 'correct'
						: 'incorrect',
				},
			},
			tests: tests,
			analysis: analysis,
			recommendations: generateRecommendations(analysis, tests),
		})
	} catch (error) {
		console.error('Debug endpoint error:', error)
		return NextResponse.json(
			{
				error: 'Debug failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

function analyzeResults(tests: any, envVars: any) {
	const analysis = {
		credentialsFormat: 'unknown',
		apiAccess: 'unknown',
		uploadCapability: 'unknown',
		likelyIssue: 'unknown',
	}

	// Check credential format
	const publicOk = envVars.publicKey?.startsWith('public_')
	const privateOk = envVars.privateKey?.startsWith('private_')
	const urlOk = envVars.urlEndpoint?.startsWith('https://ik.imagekit.io/')

	if (publicOk && privateOk && urlOk) {
		analysis.credentialsFormat = 'correct'
	} else {
		analysis.credentialsFormat = 'incorrect'
		analysis.likelyIssue = 'credential_format'
		return analysis
	}

	// Check API access
	if (tests.listFiles.success) {
		analysis.apiAccess = 'working'
	} else if (tests.authentication.success) {
		analysis.apiAccess = 'auth_generated_but_api_failed'
		analysis.likelyIssue = 'account_issue'
	} else {
		analysis.apiAccess = 'failed'
		analysis.likelyIssue = 'credential_invalid'
	}

	// Check upload capability
	if (tests.uploadAuth.success) {
		analysis.uploadCapability = 'working'
		analysis.likelyIssue = 'none'
	} else if (tests.uploadAuth.isAuthError) {
		analysis.uploadCapability = 'auth_failed'
		if (analysis.apiAccess === 'working') {
			analysis.likelyIssue = 'upload_permission_missing'
		} else {
			analysis.likelyIssue = 'credential_invalid'
		}
	} else if (tests.uploadAuth.isQuotaError) {
		analysis.uploadCapability = 'quota_exceeded'
		analysis.likelyIssue = 'quota_limit'
	} else {
		analysis.uploadCapability = 'unknown_error'
		analysis.likelyIssue = 'other'
	}

	return analysis
}

function generateRecommendations(analysis: any, tests: any) {
	const recommendations = []

	switch (analysis.likelyIssue) {
		case 'credential_format':
			recommendations.push('❌ Fix your credential format in .env.local')
			recommendations.push('- Public key should start with "public_"')
			recommendations.push('- Private key should start with "private_"')
			recommendations.push('- URL should start with "https://ik.imagekit.io/"')
			break

		case 'credential_invalid':
			recommendations.push('❌ Your credentials appear to be invalid')
			recommendations.push('- Go to ImageKit Dashboard → Developer → API Keys')
			recommendations.push("- Copy the EXACT values (don't retype them)")
			recommendations.push(
				"- Make sure you're logged into the correct ImageKit account"
			)
			recommendations.push('- Try generating new API keys')
			break

		case 'account_issue':
			recommendations.push('❌ Your ImageKit account may have issues')
			recommendations.push('- Check if your account is suspended or expired')
			recommendations.push('- Verify your account status in ImageKit dashboard')
			recommendations.push('- Contact ImageKit support if needed')
			break

		case 'upload_permission_missing':
			recommendations.push('❌ Your API keys can read but cannot upload')
			recommendations.push('- Check API key permissions in ImageKit dashboard')
			recommendations.push('- Make sure the keys have upload permissions')
			recommendations.push('- Try regenerating your API keys')
			break

		case 'quota_limit':
			recommendations.push("❌ You've hit your ImageKit usage quota")
			recommendations.push('- Check your usage in ImageKit dashboard')
			recommendations.push('- Upgrade your plan or wait for quota reset')
			break

		case 'none':
			recommendations.push('✅ Everything looks good!')
			recommendations.push('- ImageKit should be working correctly')
			recommendations.push(
				'- If still having issues, try restarting your server'
			)
			break

		default:
			recommendations.push('❓ Unable to determine the exact issue')
			recommendations.push('- Check all the test results above')
			recommendations.push('- Try the basic troubleshooting steps')
			recommendations.push(
				'- Contact ImageKit support with these debug results'
			)
	}

	return recommendations
}
