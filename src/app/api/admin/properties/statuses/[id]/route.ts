// src/app/api/admin/statuses/[id]/route.ts - Individual status management
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
			'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

// GET - Fetch single status
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params

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
			WHERE id = ${parseInt(id)}
		`

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Status not found' }, { status: 404 })
		}

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error fetching status:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch status' },
			{ status: 500 }
		)
	}
}

// PUT - Update status
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params

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

		// Check if name already exists for other statuses
		const existing = await sql`
			SELECT id FROM property_statuses 
			WHERE name = ${name} AND id != ${parseInt(id)}
		`

		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await sql`
			UPDATE property_statuses 
			SET 
				name = ${name}, 
				color = ${color || '#gray'}, 
				is_active = ${is_active !== false}, 
				sort_order = ${sort_order || 0}
			WHERE id = ${parseInt(id)}
			RETURNING *
		`

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Status not found' }, { status: 404 })
		}

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error updating status:', error)
		return NextResponse.json(
			{ error: 'Failed to update status' },
			{ status: 500 }
		)
	}
}

// DELETE - Delete status
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params

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

		// Check if status is being used by any properties
		const propertiesUsingStatus = await sql`
			SELECT COUNT(*) as count 
			FROM properties 
			WHERE status = ${parseInt(id)}
		`

		if (parseInt(propertiesUsingStatus.rows[0].count) > 0) {
			return NextResponse.json(
				{
					error:
						'Cannot delete status that is being used by properties. Please update those properties first.',
				},
				{ status: 400 }
			)
		}

		const result = await sql`
			DELETE FROM property_statuses 
			WHERE id = ${parseInt(id)}
			RETURNING id
		`

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Status not found' }, { status: 404 })
		}

		return NextResponse.json({ success: true, deletedId: result.rows[0].id })
	} catch (error) {
		console.error('Error deleting status:', error)
		return NextResponse.json(
			{ error: 'Failed to delete status' },
			{ status: 500 }
		)
	}
}
