import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

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
        console.log('🌍 Public API: Fetching property statuses...')

        const result = await sql`
            SELECT id, name, color, is_active, sort_order
            FROM property_statuses
            ORDER BY name ASC
        `

        console.log(`✅ Public API: Found ${result.rows.length} property statuses`)

        const response = NextResponse.json(result.rows)
        return corsResponse(response)
    } catch (error) {
        console.error('Error fetching property statuses:', error)
        const response = NextResponse.json(
            { error: 'Failed to fetch property statuses' },
            { status: 500 }
        )
        return corsResponse(response)
    }
}