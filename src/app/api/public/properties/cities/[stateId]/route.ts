import { NextResponse } from 'next/server'
import { getCitiesByState } from '@/services/propertyService'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
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
			const response = NextResponse.json(
				{ error: 'Invalid state ID' },
				{ status: 400 }
			)
			return corsResponse(response)
		}

		const cities = await getCitiesByState(stateId)
		const response = NextResponse.json(cities)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching cities:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch cities' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
