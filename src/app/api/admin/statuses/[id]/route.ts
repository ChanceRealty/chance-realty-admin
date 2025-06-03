// src/app/api/admin/statuses/[id]/route.ts - Individual status management
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

// GET - Fetch single status
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
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

		const statusId = parseInt(id)
		if (isNaN(statusId)) {
			return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 })
		}

		const result = await sql`
			SELECT * FROM property_statuses WHERE id = ${statusId}
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

		const statusId = parseInt(id)
		if (isNaN(statusId)) {
			return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 })
		}

		const {
			name,
			display_name,
			display_name_armenian,
			color,
			is_active,
			sort_order,
		} = await request.json()

		// Validate required fields
		if (!name || !display_name) {
			return NextResponse.json(
				{ error: 'Name and display name are required' },
				{ status: 400 }
			)
		}

		// Check if name already exists for other statuses
		const existingStatus = await sql`
			SELECT id FROM property_statuses WHERE name = ${name} AND id != ${statusId}
		`

		if (existingStatus.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Status name already exists' },
				{ status: 400 }
			)
		}

		const result = await sql`
			UPDATE property_statuses 
			SET 
				name = ${name},
				display_name = ${display_name},
				display_name_armenian = ${display_name_armenian || null},
				color = ${color || '#gray'},
				is_active = ${is_active !== undefined ? is_active : true},
				sort_order = ${sort_order || 0},
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ${statusId}
			RETURNING *
		`

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Status not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			status: result.rows[0],
			message: 'Status updated successfully',
		})
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

		const statusId = parseInt(id)
		if (isNaN(statusId)) {
			return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 })
		}

		// Check if status is being used by any properties
		const propertiesUsingStatus = await sql`
			SELECT ps.name
			FROM property_statuses ps
			JOIN properties p ON p.status = ps.name
			WHERE ps.id = ${statusId}
			LIMIT 1
		`

		if (propertiesUsingStatus.rows.length > 0) {
			return NextResponse.json(
				{ error: 'Cannot delete status that is being used by properties' },
				{ status: 400 }
			)
		}

		const result = await sql`
			DELETE FROM property_statuses WHERE id = ${statusId}
		`

		if (result.rowCount === 0) {
			return NextResponse.json({ error: 'Status not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			message: 'Status deleted successfully',
		})
	} catch (error) {
		console.error('Error deleting status:', error)
		return NextResponse.json(
			{ error: 'Failed to delete status' },
			{ status: 500 }
		)
	}
}
