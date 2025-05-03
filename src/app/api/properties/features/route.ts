// src/app/api/properties/features/route.ts
import { NextResponse } from 'next/server'
import { getPropertyFeatures } from '@/services/propertyService'

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
		const features = await getPropertyFeatures()
		return NextResponse.json(features)
	} catch (error) {
		console.error('Error fetching features:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch features' },
			{ status: 500 }
		)
	}
}
