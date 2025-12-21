// src/app/api/admin/statuses/[id]/route.ts
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

		const result = await query(
			'SELECT id, name, color, is_active, sort_order, created_at, updated_at FROM property_statuses WHERE id = $1',
			[parseInt(id)]
		)

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
			return NextResponse.json({ error: 'Name is required' }, { status: 400 })
		}

		// Check if name already exists for other statuses
		const existing = await query(`
			SELECT id FROM property_statuses 
			WHERE name = $1 AND id != $2
		`, [name, parseInt(id)])

		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await query(
			`UPDATE property_statuses 
   SET name = $1, color = $2, is_active = $3, sort_order = $4, updated_at = CURRENT_TIMESTAMP
   WHERE id = $5 RETURNING *`,
			[
				name,
				color || '#gray',
				is_active !== false,
				sort_order || 0,
				parseInt(id),
			]
		)

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
		const propertiesUsingStatus = await query(`
			SELECT COUNT(*) as count 
			FROM properties 
			WHERE status = $1
		` , [parseInt(id)])
		if (parseInt(propertiesUsingStatus.rows[0].count) > 0) {
			return NextResponse.json(
				{
					error:
						'Cannot delete status that is being used by properties. Please update those properties first.',
				},
				{ status: 400 }
			)
		}

		const result = await query(
			'DELETE FROM property_statuses WHERE id = $1 RETURNING id',
			[parseInt(id)]
		)
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
