// src/app/api/properties/states/route.ts
import { NextResponse } from 'next/server'
import { getStates } from '@/services/propertyService'

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
		const states = await getStates()
		return NextResponse.json(states)
	} catch (error) {
		console.error('Error fetching states:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch states' },
			{ status: 500 }
		)
	}
}
