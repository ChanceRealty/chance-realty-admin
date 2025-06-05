import { NextResponse } from 'next/server'
import { getStates } from '@/services/propertyService'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function GET() {
	try {
		const states = await getStates()
		const response = NextResponse.json(states)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching states:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch states' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
