import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
	console.log('Middleware: Processing request for', request.nextUrl.pathname)

	const token = request.cookies.get('token')?.value
	console.log('Middleware: Token exists?', !!token)

	if (request.nextUrl.pathname.startsWith('/admin')) {
		if (!token) {
			console.log('Middleware: No token, redirecting to login')
			return NextResponse.redirect(new URL('/login', request.url))
		}

		try {
			const decoded = verifyToken(token)
			console.log('Middleware: Token decoded:', decoded)

			if (!decoded || decoded.role !== 'admin') {
				console.log('Middleware: Invalid token or not admin, redirecting')
				return NextResponse.redirect(new URL('/login', request.url))
			}

			console.log('Middleware: Valid admin token, allowing access')
		} catch (error) {
			console.error('Middleware: Token verification error:', error)
			return NextResponse.redirect(new URL('/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: '/admin/:path*',
}
