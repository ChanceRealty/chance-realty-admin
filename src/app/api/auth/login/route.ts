import { NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { LoginCredentials } from '@/types/auth'
import { serialize } from 'cookie'


export async function POST(request: Request) {
	console.log('Login API called')

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

		const { password: _, ...userWithoutPassword } = user

		console.log('Generating token...')
		const token = generateToken(userWithoutPassword)
		console.log('Token generated successfully')

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
				maxAge: 60 * 60 * 24, // 1 день
			})
		)

		return response
	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
