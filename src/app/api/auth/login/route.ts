// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { LoginCredentials } from '@/types/auth'
import { serialize } from 'cookie'

export async function POST(request: Request) {
	console.log('Login API called')
	console.log('JWT_SECRET exists:', !!process.env.NEXT_PUBLIC_JWT_SECRET)

	try {
		const { email, password }: LoginCredentials = await request.json()
		console.log('Received credentials:', { email, password: '***' })

		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			)
		}

		console.log('Fetching user from database...')
		const user = await getUserByEmail(email)
		console.log('User found:', user ? 'Yes' : 'No')

		if (!user) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			)
		}

		console.log('Verifying password...')
		const isValidPassword = await verifyPassword(password, user.password)
		console.log('Password valid:', isValidPassword)

		if (!isValidPassword) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			)
		}

		const { password: _password, ...userWithoutPassword } = user
		
		console.log('Generating token...')
		let token
		try {
			token = generateToken(userWithoutPassword)
			console.log('Token generated successfully')
		} catch (tokenError) {
			console.error('Token generation error:', tokenError)
			return NextResponse.json(
				{ error: 'Failed to generate token' },
				{ status: 500 }
			)
		}

		const response = NextResponse.json({
			message: 'Login successful',
			user: userWithoutPassword,
		})

		response.headers.set(
			'Set-Cookie',
			serialize('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
				maxAge: 60 * 60 * 24, // 1 day
			})
		)

		return response
	} catch (error) {
		console.error('Login error details:', error)
		console.error(
			'Error stack:',
			error instanceof Error ? error.stack : 'No stack trace'
		)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
