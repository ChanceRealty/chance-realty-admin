import { NextResponse } from 'next/server'
import { getPropertyByCustomId } from '@/services/propertyService'

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
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: customId } = await params

		const property = await getPropertyByCustomId(customId)

		if (!property) {
			const response = NextResponse.json(
				{ error: 'Property not found' },
				{ status: 404 }
			)
			return corsResponse(response)
		}

		// Remove owner details for public access
		const { owner_name, owner_phone, ...publicProperty } = property

		const response = NextResponse.json(publicProperty)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching public property:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch property' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
