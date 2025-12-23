// src/app/api/public/properties/commercial-business-types/route.ts
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
		console.log('🏢 Public API: Fetching commercial business types...')

		const result = await query(`
			SELECT 
				id,
				name_hy,
				name_en,
				name_ru,
				is_active,
				sort_order
			FROM commercial_business_types
			WHERE is_active = true
			ORDER BY sort_order, name_hy ASC
		`)

		console.log(
			`✅ Public API: Found ${result.rows.length} commercial business types`
		)

		const response = NextResponse.json(result.rows)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching commercial business types:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch commercial business types' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
