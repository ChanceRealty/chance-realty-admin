// src/app/api/admin/statuses/route.ts - Status management API for admin
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

// Handle OPTIONS request for CORS
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

// GET - Fetch all statuses for admin management
export async function GET() {
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

		const result = await sql`
			SELECT 
				id, 
				name, 
				color, 
				is_active, 
				sort_order
			FROM property_statuses 
			ORDER BY sort_order, display_name
		`

		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching statuses:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch statuses' },
			{ status: 500 }
		)
	}
}

// POST - Create new status
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

		const {
			name,
			color,
			is_active,
			sort_order,
		} = await request.json()

		// Validate required fields
		if (!name) {
			return NextResponse.json(
				{ error: 'Name and display_name are required' },
				{ status: 400 }
			)
		}

		// Check if name already exists
		const existing = await sql`
			SELECT id FROM property_statuses WHERE name = ${name}
		`

		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await sql`
			INSERT INTO property_statuses (
				name, 
				color, 
				is_active, 
				sort_order
			)
			VALUES (
				${name}, 
				${color || '#gray'}, 
				${is_active !== false}, 
				${sort_order || 0}
			)
			RETURNING *
		`

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error creating status:', error)
		return NextResponse.json(
			{ error: 'Failed to create status' },
			{ status: 500 }
		)
	}
}
