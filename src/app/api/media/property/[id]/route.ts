// src/app/api/media/property/[id]/route.ts
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const propertyId = parseInt(params.id)

		if (isNaN(propertyId)) {
			return NextResponse.json(
				{ error: 'Invalid property ID' },
				{ status: 400 }
			)
		}

		// Get all media for the property
		const result = await sql`
      SELECT 
        id, property_id, file_id, url, thumbnail_url, 
        type, is_primary, display_order, created_at
      FROM property_media
      WHERE property_id = ${propertyId}
      ORDER BY display_order, created_at
    `

		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching property media:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch property media' },
			{ status: 500 }
		)
	}
}
