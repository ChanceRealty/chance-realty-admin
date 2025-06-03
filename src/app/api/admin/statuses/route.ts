// src/app/api/admin/statuses/route.ts - Status management API
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

// GET - Fetch all statuses
export async function GET() {
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

		const result = await sql`
			SELECT id, name, display_name, display_name_armenian, color, is_active, sort_order
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

		const { name, display_name, display_name_armenian, color, sort_order } =
			await request.json()

		// Validate required fields
		if (!name || !display_name) {
			return NextResponse.json(
				{ error: 'Name and display name are required' },
				{ status: 400 }
			)
		}

		// Check if name already exists
		const existingStatus = await sql`
			SELECT id FROM property_statuses WHERE name = ${name}
		`

		if (existingStatus.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await sql`
			INSERT INTO property_statuses (name, display_name, display_name_armenian, color, sort_order)
			VALUES (${name}, ${display_name}, ${display_name_armenian || null}, ${
			color || '#gray'
		}, ${sort_order || 0})
			RETURNING *
		`

		return NextResponse.json({
			success: true,
			status: result.rows[0],
			message: 'Status created successfully',
		})
	} catch (error) {
		console.error('Error creating status:', error)
		return NextResponse.json(
			{ error: 'Failed to create status' },
			{ status: 500 }
		)
	}
}
