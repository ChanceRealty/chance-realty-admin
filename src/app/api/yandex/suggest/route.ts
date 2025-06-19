// src/app/api/yandex/suggest/route.ts - Using Geocoder for suggestions
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

		const { query, count = 10 } = await request.json()

		if (!query || query.length < 3) {
			return NextResponse.json({ suggestions: [] })
		}

		const YANDEX_API_KEY =
			process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY

		if (!YANDEX_API_KEY) {
			return NextResponse.json(
				{ error: 'Yandex API key not configured' },
				{ status: 500 }
			)
		}

		// Create better search queries for Armenian addresses
		const searchQueries = [
			query,
			`Երևան ${query}`,
			`Armenia ${query}`,
			`Yerevan ${query}`,
		]

		// If query looks like Armenian, also try transliterated versions
		if (/[\u0530-\u058F]/.test(query)) {
			searchQueries.push(`Armenia ${query}`)
		}

		const allSuggestions: any[] = []

		// Search with each query
		for (const searchQuery of searchQueries) {
			try {
				// Using Yandex Geocoder API for address search
				const url = new URL('https://geocode-maps.yandex.ru/1.x/')
				url.searchParams.append('apikey', YANDEX_API_KEY)
				url.searchParams.append('geocode', searchQuery)
				url.searchParams.append('format', 'json')
				url.searchParams.append('results', '10') // Get more results per query
				url.searchParams.append('kind', 'house')
				// Add Armenia bbox for better filtering
				url.searchParams.append(
					'bbox',
					'43.403695,39.542834~47.090149,41.248481'
				)

				console.log(`Making geocoder request: ${searchQuery}`)

				const response = await fetch(url.toString(), {
					method: 'GET',
					headers: {
						Accept: 'application/json',
						'User-Agent': 'ChanceRealty/1.0',
					},
				})

				if (response.ok) {
					const data = await response.json()
					const geoObjects =
						data.response?.GeoObjectCollection?.featureMember || []

					for (const item of geoObjects) {
						const geoObject = item.GeoObject
						const coordinates = geoObject?.Point?.pos
						const metaData = geoObject?.metaDataProperty?.GeocoderMetaData
						const addressDetails = metaData?.Address
						const formattedAddress =
							addressDetails?.formatted || geoObject?.name

						if (formattedAddress && coordinates) {
							const [lon, lat] = coordinates.split(' ').map(parseFloat)

							// More flexible relevance check
							const addressLower = formattedAddress.toLowerCase()
							const queryLower = query.toLowerCase()
							const addressParts = addressLower
								.split(',')
								.map((part: string) => part.trim())

							const isRelevant =
								addressLower.includes(queryLower) ||
								queryLower.includes(addressParts[0]) ||
								addressParts.some((part: string) => part.includes(queryLower)) ||
								queryLower.length >= 3 // Include if query is 3+ chars (less strict)

							if (isRelevant && formattedAddress.length > 0) {
								allSuggestions.push({
									value: formattedAddress.split(',')[0] || formattedAddress,
									unrestricted_value: formattedAddress,
									data: {
										geo_lat: lat.toString(),
										geo_lon: lon.toString(),
										country: 'AM',
										region:
											addressDetails?.Components?.find(
												(c: any) => c.kind === 'province'
											)?.name || '',
										city:
											addressDetails?.Components?.find(
												(c: any) => c.kind === 'locality'
											)?.name || '',
										street:
											addressDetails?.Components?.find(
												(c: any) => c.kind === 'street'
											)?.name || '',
										house:
											addressDetails?.Components?.find(
												(c: any) => c.kind === 'house'
											)?.name || '',
									},
								})
							}
						}
					}
				}
			} catch (error) {
				console.error(`Error with query "${searchQuery}":`, error)
				// Continue with other queries
			}
		}

		// Remove duplicates based on unrestricted_value and limit results
		const uniqueSuggestions = allSuggestions
			.filter(
				(suggestion, index, array) =>
					array.findIndex(
						s => s.unrestricted_value === suggestion.unrestricted_value
					) === index
			)
			.slice(0, count)

		console.log(
			`Found ${uniqueSuggestions.length} unique suggestions for "${query}"`
		)

		return NextResponse.json({
			suggestions: uniqueSuggestions,
		})
	} catch (error) {
		console.error('Error in geocoder-based suggest API:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch address suggestions' },
			{ status: 500 }
		)
	}
}
