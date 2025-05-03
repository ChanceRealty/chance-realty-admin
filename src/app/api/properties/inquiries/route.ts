// src/app/api/properties/inquiries/route.ts
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS'
	)
	response.headers.set(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization'
	)
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
	try {
		const { propertyId, name, email, phone, message } = await request.json()

		if (!propertyId || !name || !email || !message) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		// Check if user is logged in
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value
		let userId = null

		if (token) {
			const user = verifyToken(token)
			if (user) {
				userId = user.id
			}
		}

		const result = await sql`
      INSERT INTO property_inquiries (property_id, user_id, name, email, phone, message)
      VALUES (${propertyId}, ${userId}, ${name}, ${email}, ${phone}, ${message})
      RETURNING id
    `

		return NextResponse.json({
			success: true,
			inquiryId: result.rows[0].id,
		})
	} catch (error) {
		console.error('Error creating inquiry:', error)
		return NextResponse.json(
			{ error: 'Failed to create inquiry' },
			{ status: 500 }
		)
	}
}
