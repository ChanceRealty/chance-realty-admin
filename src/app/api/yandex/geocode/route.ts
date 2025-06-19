// src/app/api/yandex/geocode/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
	try {
		// Verify admin authentication (optional - remove if not needed)
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		const { address } = await request.json()

		if (!address || address.trim().length === 0) {
			return NextResponse.json(
				{ error: 'Address is required' },
				{ status: 400 }
			)
		}

		const YANDEX_API_KEY =
			process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY

		if (!YANDEX_API_KEY) {
			return NextResponse.json(
				{ error: 'Yandex API key not configured' },
				{ status: 500 }
			)
		}

		// Using Yandex Geocoder API
		const url = new URL('https://geocode-maps.yandex.ru/1.x/')
		url.searchParams.append('apikey', YANDEX_API_KEY)
		url.searchParams.append('geocode', address)
		url.searchParams.append('format', 'json')
		url.searchParams.append('results', '1')
		url.searchParams.append('kind', 'house') // More precise geocoding

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) {
			throw new Error(`Yandex Geocoder API error: ${response.status}`)
		}

		const data = await response.json()

		// Parse the response
		const geoObjects = data.response?.GeoObjectCollection?.featureMember || []

		if (geoObjects.length === 0) {
			return NextResponse.json({
				coordinates: null,
				message: 'Address not found',
			})
		}

		const firstResult = geoObjects[0]?.GeoObject
		const coordinates = firstResult?.Point?.pos

		if (!coordinates) {
			return NextResponse.json({
				coordinates: null,
				message: 'Coordinates not found for this address',
			})
		}

		// Yandex returns coordinates as "longitude latitude"
		const [lon, lat] = coordinates.split(' ').map(parseFloat)

		if (isNaN(lat) || isNaN(lon)) {
			return NextResponse.json({
				coordinates: null,
				message: 'Invalid coordinates received',
			})
		}

		// Extract additional details
		const metaData = firstResult?.metaDataProperty?.GeocoderMetaData
		const addressDetails = metaData?.Address

		return NextResponse.json({
			coordinates: {
				lat: lat,
				lon: lon,
			},
			address_details: {
				formatted: addressDetails?.formatted || address,
				components: addressDetails?.Components || [],
				precision: metaData?.precision,
				kind: metaData?.kind,
			},
			original_query: address,
		})
	} catch (error) {
		console.error('Error in geocode API:', error)
		return NextResponse.json(
			{ error: 'Failed to geocode address' },
			{ status: 500 }
		)
	}
}

// Additional helper endpoint to reverse geocode (coordinates to address)
export async function GET(request: Request) {
	try {
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		const { searchParams } = new URL(request.url)
		const lat = searchParams.get('lat')
		const lon = searchParams.get('lon')

		if (!lat || !lon) {
			return NextResponse.json(
				{ error: 'Latitude and longitude are required' },
				{ status: 400 }
			)
		}

		const YANDEX_API_KEY =
			process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY

		if (!YANDEX_API_KEY) {
			return NextResponse.json(
				{ error: 'Yandex API key not configured' },
				{ status: 500 }
			)
		}

		// Reverse geocoding
		const coordinates = `${lon},${lat}` // Yandex expects longitude,latitude
		const url = new URL('https://geocode-maps.yandex.ru/1.x/')
		url.searchParams.append('apikey', YANDEX_API_KEY)
		url.searchParams.append('geocode', coordinates)
		url.searchParams.append('format', 'json')
		url.searchParams.append('results', '1')
		url.searchParams.append('kind', 'house')

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) {
			throw new Error(`Yandex Geocoder API error: ${response.status}`)
		}

		const data = await response.json()

		const geoObjects = data.response?.GeoObjectCollection?.featureMember || []

		if (geoObjects.length === 0) {
			return NextResponse.json({
				address: null,
				message: 'Address not found for these coordinates',
			})
		}

		const firstResult = geoObjects[0]?.GeoObject
		const metaData = firstResult?.metaDataProperty?.GeocoderMetaData
		const addressDetails = metaData?.Address

		return NextResponse.json({
			address: addressDetails?.formatted || 'Address not found',
			address_details: {
				formatted: addressDetails?.formatted,
				components: addressDetails?.Components || [],
				precision: metaData?.precision,
				kind: metaData?.kind,
			},
			coordinates: {
				lat: parseFloat(lat),
				lon: parseFloat(lon),
			},
		})
	} catch (error) {
		console.error('Error in reverse geocode API:', error)
		return NextResponse.json(
			{ error: 'Failed to reverse geocode coordinates' },
			{ status: 500 }
		)
	}
}
