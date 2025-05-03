// src/app/api/properties/favorites/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import {
	addPropertyToFavorites,
	removePropertyFromFavorites,
	getUserFavorites,
} from '@/services/propertyService'

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

		const favorites = await getUserFavorites(user.id)
		return NextResponse.json(favorites)
	} catch (error) {
		console.error('Error fetching favorites:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch favorites' },
			{ status: 500 }
		)
	}
}

export async function POST(request: Request) {
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

		const { propertyId } = await request.json()

		if (!propertyId) {
			return NextResponse.json(
				{ error: 'Property ID is required' },
				{ status: 400 }
			)
		}

		await addPropertyToFavorites(user.id, propertyId)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error adding to favorites:', error)
		return NextResponse.json(
			{ error: 'Failed to add to favorites' },
			{ status: 500 }
		)
	}
}

export async function DELETE(request: Request) {
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

		const { propertyId } = await request.json()

		if (!propertyId) {
			return NextResponse.json(
				{ error: 'Property ID is required' },
				{ status: 400 }
			)
		}

		await removePropertyFromFavorites(user.id, propertyId)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error removing from favorites:', error)
		return NextResponse.json(
			{ error: 'Failed to remove from favorites' },
			{ status: 500 }
		)
	}
}
