// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST() {
	try {
		// Clear the token cookie by setting it to expire immediately
		const response = NextResponse.json({
			message: 'Logout successful',
		})

		response.headers.set(
			'Set-Cookie',
			serialize('token', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
				maxAge: 0, // Expire immediately
			})
		)

		return response
	} catch (error) {
		console.error('Logout error:', error)
		return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
	}
}
