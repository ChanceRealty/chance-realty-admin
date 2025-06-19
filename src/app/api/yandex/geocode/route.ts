// src/app/api/yandex/geocode/route.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
	try {
		// Verify admin authentication
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
			console.warn('⚠️ Yandex API key not configured, using fallback')
			return getFallbackCoordinates(address)
		}

		try {
			// Using Yandex Geocoder API
			const url = new URL('https://geocode-maps.yandex.ru/1.x/')
			url.searchParams.append('apikey', YANDEX_API_KEY)
			url.searchParams.append('geocode', address)
			url.searchParams.append('format', 'json')
			url.searchParams.append('results', '1')
			url.searchParams.append('kind', 'house')

			console.log('🌐 Yandex Geocoder API request:', address)

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'ChanceRealty/1.0',
				},
			})

			if (!response.ok) {
				console.error(
					'Yandex Geocoder API error:',
					response.status,
					response.statusText
				)
				return getFallbackCoordinates(address)
			}

			const data = await response.json()
			console.log('Yandex Geocoder API response received')

			const geoObjects = data.response?.GeoObjectCollection?.featureMember || []

			if (geoObjects.length === 0) {
				console.warn('No results from Yandex, using fallback')
				return getFallbackCoordinates(address)
			}

			const firstResult = geoObjects[0]?.GeoObject
			const coordinates = firstResult?.Point?.pos

			if (!coordinates) {
				console.warn('No coordinates in Yandex response, using fallback')
				return getFallbackCoordinates(address)
			}

			// Yandex returns coordinates as "longitude latitude"
			const [lon, lat] = coordinates.split(' ').map(parseFloat)

			if (isNaN(lat) || isNaN(lon)) {
				console.warn('Invalid coordinates from Yandex, using fallback')
				return getFallbackCoordinates(address)
			}

			// Extract additional details
			const metaData = firstResult?.metaDataProperty?.GeocoderMetaData
			const addressDetails = metaData?.Address

			console.log(`✅ Yandex geocoding successful: ${lat}, ${lon}`)

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
				source: 'yandex',
			})
		} catch (error) {
			console.error('Yandex Geocoder API error:', error)
			return getFallbackCoordinates(address)
		}
	} catch (error) {
		console.error('Error in geocode API:', error)
		return NextResponse.json(
			{ error: 'Failed to geocode address' },
			{ status: 500 }
		)
	}
}

// Fallback coordinates for major Armenian locations
function getFallbackCoordinates(address: string) {
	const addressLower = address.toLowerCase()

	const fallbackLocations: Record<string, { lat: number; lon: number }> = {
		երևան: { lat: 40.1811, lon: 44.5136 },
		yerevan: { lat: 40.1811, lon: 44.5136 },
		մաշտոց: { lat: 40.1872, lon: 44.5152 },
		mashtots: { lat: 40.1872, lon: 44.5152 },
		բաղրամյան: { lat: 40.189, lon: 44.5144 },
		baghramyan: { lat: 40.189, lon: 44.5144 },
		կենտրոն: { lat: 40.1811, lon: 44.5136 },
		kentron: { lat: 40.1811, lon: 44.5136 },
		գյումրի: { lat: 40.7833, lon: 43.85 },
		gyumri: { lat: 40.7833, lon: 43.85 },
		վանաձոր: { lat: 40.8167, lon: 44.4833 },
		vanadzor: { lat: 40.8167, lon: 44.4833 },
	}

	for (const [key, coords] of Object.entries(fallbackLocations)) {
		if (addressLower.includes(key)) {
			console.log(
				`✅ Using fallback coordinates for ${key}: ${coords.lat}, ${coords.lon}`
			)
			return NextResponse.json({
				coordinates: coords,
				address_details: {
					formatted: address,
					source: 'fallback',
				},
				original_query: address,
				source: 'fallback',
			})
		}
	}

	console.warn('No fallback coordinates found for:', address)
	return NextResponse.json({
		coordinates: null,
		message: 'Address not found',
		original_query: address,
		source: 'none',
	})
}
