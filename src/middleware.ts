import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
	console.log('Middleware: Processing request for', request.nextUrl.pathname)

	if (request.nextUrl.pathname.startsWith('/api/')) {
		// Get the origin from the request
		const origin = request.headers.get('origin') || '*'

		// Define allowed origins
		const allowedOrigins = [
			'http://localhost:3001',
			'https://realty-app-liard.vercel.app',
		]
		const allowOrigin = allowedOrigins.includes(origin) ? origin : '*'

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new NextResponse(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': allowOrigin,
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Max-Age': '86400',
				},
			})
		}

		// For actual requests, we'll add CORS headers to the response
		const response = NextResponse.next()
		response.headers.set('Access-Control-Allow-Origin', allowOrigin)
		response.headers.set(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, OPTIONS'
		)
		response.headers.set(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization'
		)

		// Continue with the response
		return response
	}


	const token = request.cookies.get('token')?.value
	console.log('Middleware: Token exists?', !!token)

	if (request.nextUrl.pathname.startsWith('/admin')) {
		if (!token) {
			console.log('Middleware: No token, redirecting to login')
			return NextResponse.redirect(new URL('/login', request.url))
		}

		try {
			const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET
			console.log('Middleware: JWT_SECRET exists?', !!JWT_SECRET)

			if (!JWT_SECRET) {
				console.error('Middleware: JWT_SECRET is not defined')
				return NextResponse.redirect(new URL('/login', request.url))
			}

			// Convert the secret to Uint8Array as required by jose
			const secret = new TextEncoder().encode(JWT_SECRET)

			// Verify the token
			const { payload } = await jwtVerify(token, secret)

			console.log('Middleware: Token decoded successfully:', payload)

			if (!payload || payload.role !== 'admin') {
				console.log('Middleware: Invalid token or not admin, redirecting')
				return NextResponse.redirect(new URL('/login', request.url))
			}

			console.log('Middleware: Valid admin token, allowing access')
			return NextResponse.next()
		} catch (error) {
			console.error('Middleware: Token verification error:', error)
			return NextResponse.redirect(new URL('/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/admin/:path*',
		'/api/:path*', // Add API routes to the matcher
	],
}