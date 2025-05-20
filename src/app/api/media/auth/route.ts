// src/app/api/media/auth/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getAuthenticationParameters } from '@/lib/imagekit'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

export async function GET(request: Request) {
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

		// Get ImageKit authentication parameters
		const authParams = await getAuthenticationParameters()

		return NextResponse.json(authParams)
	} catch (error) {
		console.error('Authentication error:', error)
		return NextResponse.json(
			{ error: 'Failed to generate authentication parameters' },
			{ status: 500 }
		)
	}
}
