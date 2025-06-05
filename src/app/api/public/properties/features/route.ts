import { NextResponse } from 'next/server'
import { getPropertyFeatures } from '@/services/propertyService'

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
		const features = await getPropertyFeatures()
		const response = NextResponse.json(features)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching features:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch features' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
