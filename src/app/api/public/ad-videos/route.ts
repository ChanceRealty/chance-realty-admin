// src/app/api/public/ad-videos/route.ts
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

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const result = await query(
			'SELECT id, url, created_at FROM ad_videos ORDER BY created_at DESC',
		)

		const response = NextResponse.json(result.rows)
		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching public ad videos:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch ad videos' },
			{ status: 500 },
		)
		return corsResponse(response)
	}
}
