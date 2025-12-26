// src/app/api/yandex/suggest/route.ts - FIXED VERSION
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
			console.warn('⚠️ Yandex API key not found, using fallback suggestions')
			return getFallbackSuggestions(query)
		}

		try {
			// Using Yandex Geocoder API for address search
			const url = new URL('https://geocode-maps.yandex.ru/1.x/')
			url.searchParams.append('apikey', YANDEX_API_KEY)
			url.searchParams.append('geocode', query)
			url.searchParams.append('format', 'json')
			url.searchParams.append('results', count.toString())
			url.searchParams.append('kind', 'house')
			// Add Armenia bounding box for better results
			url.searchParams.append('bbox', '43.403695,39.542834~47.090149,41.248481')

			console.log(`🌐 Yandex API request: ${query}`)

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'ChanceRealty/1.0',
				},
			})

			if (!response.ok) {
				console.warn(`Yandex API failed with status: ${response.status}`)
				return getFallbackSuggestions(query)
			}

			const data = await response.json()
			const geoObjects = data.response?.GeoObjectCollection?.featureMember || []

			console.log(`✅ Yandex API returned ${geoObjects.length} results`)

			if (geoObjects.length === 0) {
				return getFallbackSuggestions(query)
			}

			const suggestions = geoObjects
				.map((item: any) => {
					const geoObject = item.GeoObject
					const coordinates = geoObject?.Point?.pos
					const metaData = geoObject?.metaDataProperty?.GeocoderMetaData
					const addressDetails = metaData?.Address
					const formattedAddress = addressDetails?.formatted || geoObject?.name

					if (formattedAddress && coordinates) {
						const [lon, lat] = coordinates.split(' ').map(parseFloat)

						if (isNaN(lat) || isNaN(lon)) {
							console.warn(
								'⚠️ Invalid coordinates in Yandex response:',
								coordinates
							)
							return null
						}

						return {
							name: formattedAddress,
							lat: lat, 
							lon: lon, 
							isYandex: true,
							originalData: {
								geo_lat: lat.toString(),
								geo_lon: lon.toString(),
								country: 'AM',
								formatted: formattedAddress,
								components: addressDetails?.Components || [],
							},
						}
					}
					return null
				})
				.filter(Boolean) // Remove null entries

			return NextResponse.json({
				suggestions: suggestions,
			})
		} catch (error) {
			console.error(`Yandex API error: ${error}`)
			return getFallbackSuggestions(query)
		}
	} catch (error) {
		console.error('Error in Yandex suggest API:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch address suggestions' },
			{ status: 500 }
		)
	}
}

// Fallback suggestions when Yandex API fails
function getFallbackSuggestions(query: string) {
	const fallbackAddresses = [
		{
			name: 'Երևան, Մաշտոցի պողոտա',
			lat: 40.1872,
			lon: 44.5152,
			isLocal: true,
		},
		{
			name: 'Երևան, Բաղրամյան պողոտա',
			lat: 40.189,
			lon: 44.5144,
			isLocal: true,
		},
		{
			name: 'Երևան, Նալբանդյան փողոց',
			lat: 40.1833,
			lon: 44.5089,
			isLocal: true,
		},
		{ name: 'Երևան, Սարյան փողոց', lat: 40.1901, lon: 44.5089, isLocal: true },
		{ name: 'Երևան, Կասյան փողոց', lat: 40.1723, lon: 44.5234, isLocal: true },
		{
			name: 'Երևան, Վազգեն Սարգսյան փողոց',
			lat: 40.1845,
			lon: 44.5234,
			isLocal: true,
		},
		{
			name: 'Երևան, Արշակունյաց պողոտա',
			lat: 40.1934,
			lon: 44.5067,
			isLocal: true,
		},
		{
			name: 'Երևան, Կենտրոն թաղամաս',
			lat: 40.1811,
			lon: 44.5136,
			isLocal: true,
		},
		{
			name: 'Գյումրի, Վարդանանց պողոտա',
			lat: 40.7833,
			lon: 43.85,
			isLocal: true,
		},
		{
			name: 'Վանաձոր, Տիգրան Մեծի պողոտա',
			lat: 40.8167,
			lon: 44.4833,
			isLocal: true,
		},
	]

	const filtered = fallbackAddresses
		.filter(addr => addr.name.toLowerCase().includes(query.toLowerCase()))
		.slice(0, 8)

	return NextResponse.json({
		suggestions: filtered,
	})
}
