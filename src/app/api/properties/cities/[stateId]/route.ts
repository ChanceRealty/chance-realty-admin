// src/app/api/properties/cities/[stateId]/route.ts

import { NextResponse } from 'next/server'
import { getCitiesByState } from '@/services/propertyService'

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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ stateId: string }> }
) {
	try {
		const { stateId: stateIdStr } = await params
		const stateId = parseInt(stateIdStr)

		if (isNaN(stateId)) {
			return NextResponse.json({ error: 'Invalid state ID' }, { status: 400 })
		}

		const cities = await getCitiesByState(stateId)
		return NextResponse.json(cities)
	} catch (error) {
		console.error('Error fetching cities:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch cities' },
			{ status: 500 }
		)
	}
}
