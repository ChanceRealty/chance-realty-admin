// src/app/api/properties/route.ts
import { NextResponse } from 'next/server'
import { getProperties } from '@/services/propertyService'
import { ListingType, PropertyFilter, PropertyType } from '@/types/property'

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

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const filter: PropertyFilter = {
			property_type: searchParams.get('property_type') as
				| PropertyType
				| undefined,
			listing_type: searchParams.get('listing_type') as ListingType | undefined,
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
			min_area: searchParams.get('min_area')
				? parseInt(searchParams.get('min_area')!)
				: undefined,
			max_area: searchParams.get('max_area')
				? parseInt(searchParams.get('max_area')!)
				: undefined,
			features: searchParams.get('features')
				? searchParams.get('features')!.split(',').map(Number)
				: undefined,
			sort_by: searchParams.get('sort_by') as
				| 'price'
				| 'created_at'
				| 'views'
				| undefined,
			sort_order: searchParams.get('sort_order') as 'asc' | 'desc' | undefined,
			page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
			limit: searchParams.get('limit')
				? parseInt(searchParams.get('limit')!)
				: 20,
		}

		const properties = await getProperties(filter)

		return NextResponse.json(properties)
	} catch (error) {
		console.error('Error fetching properties:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch properties' },
			{ status: 500 }
		)
	}
}
