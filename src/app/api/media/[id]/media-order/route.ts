//src/app/api/media/[id]/media-order/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { transaction } from '@/lib/db'

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

		await transaction(async client => {
			for (const item of mediaOrder) {
				await client.query(
					'UPDATE property_media SET display_order = $1 WHERE id = $2 AND property_id = $3',
					[item.display_order, item.id, parseInt(id)]
				)
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error updating media order:', error)
		return NextResponse.json(
			{ error: 'Failed to update order' },
			{ status: 500 }
		)
	}
}
