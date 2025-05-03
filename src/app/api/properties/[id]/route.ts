// src/app/api/properties/[id]/route.ts
import { NextResponse } from 'next/server'
import {
	getPropertyByCustomId,
	getPropertyById,
	incrementPropertyViews,
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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: customId } = await params

		// Fetch property by custom ID
		const property = await getPropertyByCustomId(customId)

		if (!property) {
			return NextResponse.json({ error: 'Property not found' }, { status: 404 })
		}

		// Increment views (using the numeric ID for internal operations)
		const ip =
			request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
		await incrementPropertyViews(property.id, undefined, ip || undefined)

		return NextResponse.json(property)
	} catch (error) {
		console.error('Error fetching property:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch property' },
			{ status: 500 }
		)
	}
}