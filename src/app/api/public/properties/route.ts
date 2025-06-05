import { NextResponse } from 'next/server'
import { getProperties } from '@/services/propertyService'
import { PropertyFilter } from '@/types/property'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const filter: PropertyFilter = {
			property_type: searchParams.get('property_type') as any,
			listing_type: searchParams.get('listing_type') as any,
			state_id: searchParams.get('state_id')
				? parseInt(searchParams.get('state_id')!)
				: undefined,
			city_id: searchParams.get('city_id')
				? parseInt(searchParams.get('city_id')!)
				: undefined,
			min_price: searchParams.get('min_price')
				? parseFloat(searchParams.get('min_price')!)
				: undefined,
			max_price: searchParams.get('max_price')
				? parseFloat(searchParams.get('max_price')!)
				: undefined,
			bedrooms: searchParams.get('bedrooms')
				? parseInt(searchParams.get('bedrooms')!)
				: undefined,
			bathrooms: searchParams.get('bathrooms')
				? parseInt(searchParams.get('bathrooms')!)
				: undefined,
			sort_by: searchParams.get('sort_by') as any,
			sort_order: searchParams.get('sort_order') as any,
			page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
			limit: searchParams.get('limit')
				? parseInt(searchParams.get('limit')!)
				: 20,
		}

		// Use your existing service but strip owner details for public access
		const properties = await getProperties(filter)

		// Remove owner details from public response
		const publicProperties = properties.map(property => {
			const { owner_name, owner_phone, ...publicProperty } = property
			return publicProperty
		})

		const response = NextResponse.json(publicProperties)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching public properties:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch properties' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
