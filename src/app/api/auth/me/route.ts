// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function GET() {
	try {
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		}

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
			},
		})
	} catch (error) {
		console.error('Error getting user info:', error)
		return NextResponse.json(
			{ error: 'Failed to get user info' },
			{ status: 500 }
		)
	}
}
