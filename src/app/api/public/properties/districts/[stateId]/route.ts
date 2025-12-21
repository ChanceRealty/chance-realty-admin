// src/app/api/public/properties/districts/[stateId]/route.ts

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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ stateId: string }> }
) {
	try {
		const { stateId: stateIdStr } = await params
		const stateId = parseInt(stateIdStr)

		if (isNaN(stateId)) {
			const response = NextResponse.json(
				{ error: 'Invalid state ID' },
				{ status: 400 }
			)
			return corsResponse(response)
		}

		console.log(`🏘️ Public API: Fetching districts for state ID: ${stateId}`)

		const result = await query(`
			SELECT 
				d.id,
				d.name,
				d.name_hy,
				d.name_en,
				d.name_ru,
				d.state_id
			FROM districts d
			WHERE d.state_id = $1
			ORDER BY d.name_hy ASC
		`, [stateId])

		console.log(`✅ Public API: Found ${result.rows.length} districts`)

		const response = NextResponse.json(result.rows)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching districts:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch districts' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
