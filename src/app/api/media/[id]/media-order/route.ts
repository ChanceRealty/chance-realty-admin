import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const cookieStore = await cookies()
		const token = cookieStore.get('token')?.value

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

		const { mediaOrder } = await request.json()

		await sql.query('BEGIN')

		try {
			// Update each media item's display_order
			for (const item of mediaOrder) {
				await sql`
          UPDATE property_media 
          SET display_order = ${item.display_order}
          WHERE id = ${item.id} AND property_id = ${parseInt(id)}
        `
			}

			await sql.query('COMMIT')
			return NextResponse.json({ success: true })
		} catch (error) {
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Error updating media order:', error)
		return NextResponse.json(
			{ error: 'Failed to update order' },
			{ status: 500 }
		)
	}
}
