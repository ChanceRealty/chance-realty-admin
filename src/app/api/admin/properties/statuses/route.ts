// src/app/api/properties/statuses/route.ts - Public API for property forms
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

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

// GET - Fetch active statuses for property forms
export async function GET() {
	try {
		const result = await sql`
			SELECT name, display_name, display_name_armenian, color
			FROM property_statuses 
			WHERE is_active = true
			ORDER BY sort_order, display_name
		`

		const response = NextResponse.json(result.rows)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching statuses:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch statuses' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
