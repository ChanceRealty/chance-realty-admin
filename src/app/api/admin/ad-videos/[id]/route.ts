// src/app/api/admin/ad-videos/[id]/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { imagekit } from '@/lib/imagekit'

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } },
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
				{ status: 403 },
			)
		}

		const videoId = parseInt(id)
		if (isNaN(videoId)) {
			return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
		}

		// Получаем видео из базы
		const videoResult = await query(
			'SELECT id, file_id FROM ad_videos WHERE id = $1',
			[videoId],
		)

		if (videoResult.rows.length === 0) {
			return NextResponse.json({ error: 'Video not found' }, { status: 404 })
		}

		const video = videoResult.rows[0]

		// Удаляем из ImageKit
		try {
			await imagekit.deleteFile(video.file_id)
		} catch (ikError) {
			console.warn('Failed to delete from ImageKit (continuing):', ikError)
		}

		// Удаляем из базы
		await query('DELETE FROM ad_videos WHERE id = $1', [videoId])

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting ad video:', error)
		return NextResponse.json(
			{ error: 'Failed to delete video' },
			{ status: 500 },
		)
	}
}
