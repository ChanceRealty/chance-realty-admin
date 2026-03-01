import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	try {
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value
		if (!token)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const user = verifyToken(token)
		if (!user || user.role !== 'admin')
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 },
			)

		const result = await query(
			'SELECT id, file_id, url, created_at FROM ad_videos ORDER BY created_at DESC',
		)
		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching ad videos:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch ad videos' },
			{ status: 500 },
		)
	}
}

export async function POST(req: NextRequest) {
	try {
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value
		if (!token)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const user = verifyToken(token)
		if (!user || user.role !== 'admin')
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 },
			)

		const { fileId, url } = await req.json()
		if (!fileId || !url)
			return NextResponse.json(
				{ error: 'Missing fileId or url' },
				{ status: 400 },
			)

		const result = await query(
			'INSERT INTO ad_videos (file_id, url) VALUES ($1, $2) RETURNING id, file_id, url, created_at',
			[fileId, url],
		)
		return NextResponse.json(result.rows[0], { status: 201 })
	} catch (error) {
		console.error('Error saving ad video:', error)
		return NextResponse.json({ error: 'Failed to save video' }, { status: 500 })
	}
}
