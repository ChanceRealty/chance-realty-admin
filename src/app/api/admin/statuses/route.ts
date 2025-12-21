// src/app/api/admin/statuses/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query, transaction } from '@/lib/db'

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
		console.log('📡 Statuses API: Fetching statuses...')

		// Verify admin authentication
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			console.error('❌ No token provided')
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			console.error('❌ Not an admin user')
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		console.log('✅ Admin authenticated, fetching statuses from database...')

		// Query that matches your exact database schema
		const result = await query(`
			SELECT 
				id, 
				name, 
				color, 
				is_active, 
				sort_order,
				created_at,
				updated_at
			FROM property_statuses 
			WHERE is_active = true
			ORDER BY sort_order, name
		`)

		console.log(`✅ Found ${result.rows.length} statuses:`, result.rows)

		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('❌ Error fetching statuses:', error)
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
			return NextResponse.json({ error: 'Name is required' }, { status: 400 })
		}

		// Check if name already exists
		const existing = await query(`
			SELECT id FROM property_statuses WHERE name = $1
		`, [name])

		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await query(
			`INSERT INTO property_statuses (name, color, is_active, sort_order, created_at, updated_at)
   VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
			[name, color || '#gray', is_active !== false, sort_order || 0]
		)

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error creating status:', error)
		return NextResponse.json(
			{ error: 'Failed to create status' },
			{ status: 500 }
		)
	}
}
