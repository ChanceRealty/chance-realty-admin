// src/app/api/yandex/suggest/route.ts
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

		const { query, count = 10 } = await request.json()

		if (!query || query.length < 3) {
			return NextResponse.json({ suggestions: [] })
		}

		// Using DaData API (which is based on Yandex data)
		// You can replace this with direct Yandex Suggest API if you have access
		const DADATA_API_KEY = process.env.DADATA_API_KEY

		if (!DADATA_API_KEY) {
			return NextResponse.json(
				{ error: 'API key not configured' },
				{ status: 500 }
			)
		}

		const response = await fetch(
			'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Token ${DADATA_API_KEY}`,
				},
				body: JSON.stringify({
					query: query,
					count: count,
					locations: [
						{
							country: '*',
						},
					],
				}),
			}
		)

		if (!response.ok) {
			throw new Error(`DaData API error: ${response.status}`)
		}

		const data = await response.json()

		return NextResponse.json({
			suggestions: data.suggestions || [],
		})
	} catch (error) {
		console.error('Error in suggest API:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch suggestions' },
			{ status: 500 }
		)
	}
}

// Alternative implementation using Yandex Maps API directly
export async function POST_YANDEX_DIRECT(request: Request) {
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

		const { query, count = 10 } = await request.json()

		if (!query || query.length < 3) {
			return NextResponse.json({ suggestions: [] })
		}

		const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY

		if (!YANDEX_API_KEY) {
			return NextResponse.json(
				{ error: 'Yandex API key not configured' },
				{ status: 500 }
			)
		}

		// Using Yandex Suggest API directly
		const url = new URL('https://suggest-maps.yandex.ru/v1/suggest')
		url.searchParams.append('apikey', YANDEX_API_KEY)
		url.searchParams.append('text', query)
		url.searchParams.append('results', count.toString())
		url.searchParams.append('attrs', 'uri,name,geometry')

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		})

		if (!response.ok) {
			throw new Error(`Yandex Suggest API error: ${response.status}`)
		}

		const data = await response.json()

		// Transform Yandex response to match our expected format
		const suggestions =
			data.results?.map((item: any) => ({
				value: item.title?.text || item.subtitle?.text || '',
				unrestricted_value: `${item.title?.text || ''} ${
					item.subtitle?.text || ''
				}`.trim(),
				data: {
					geo_lat: item.geometry?.[1]?.toString(),
					geo_lon: item.geometry?.[0]?.toString(),
					country: item.address?.country_code,
					region: item.address?.region,
					city: item.address?.locality,
					street: item.address?.street,
					house: item.address?.house,
				},
			})) || []

		return NextResponse.json({
			suggestions,
		})
	} catch (error) {
		console.error('Error in Yandex suggest API:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch suggestions from Yandex' },
			{ status: 500 }
		)
	}
}
