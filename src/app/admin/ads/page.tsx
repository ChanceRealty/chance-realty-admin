'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, Upload, Video, Loader2 } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { upload } from '@imagekit/javascript'

interface AdVideo {
	id: number
	file_id: string
	url: string
	created_at: string
}

export default function AdVideosPage() {
	const [videos, setVideos] = useState<AdVideo[]>([])
	const [loading, setLoading] = useState(true)
	const [uploading, setUploading] = useState(false)
	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean
		videoId: number | null
	}>({ open: false, videoId: null })
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { toasts, removeToast, showSuccess, showError } = useToast()

	useEffect(() => {
		fetchVideos()
	}, [])

	const fetchVideos = async () => {
		try {
			const response = await fetch('/api/admin/ad-videos')
			if (!response.ok) throw new Error('Failed to fetch')
			const data = await response.json()
			setVideos(data)
		} catch (error) {
			showError('Չհաջողվեց բեռնել տեսանյութերը')
		} finally {
			setLoading(false)
		}
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('video/')) {
			showError('Խնդրում ենք ընտրել տեսանյութ')
			return
		}

		setUploading(true)

		try {
			// Step 1: Get auth params from your server
			const authRes = await fetch('/api/imagekit-auth')
			const { token, signature, expire } = await authRes.json()

			// Step 2: Upload directly to ImageKit from browser
			const uploadResult = await upload({
				file: file,
				fileName: file.name,
				folder: '/ad-videos',
				token,
				signature,
				expire,
				publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
			})

			// Step 3: Save to DB
			const response = await fetch('/api/admin/ad-videos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileId: uploadResult.fileId,
					url: uploadResult.url,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to save video')
			}

			const newVideo = await response.json()
			setVideos(prev => [newVideo, ...prev])
			showSuccess('Տեսանյութը հաջողությամբ վերբեռնվեց')
		} catch (error) {
			showError(error instanceof Error ? error.message : 'Վերբեռնումը ձախողվեց')
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	const handleRequestDelete = (videoId: number) => {
		setConfirmDialog({ open: true, videoId })
	}

	const handleConfirmDelete = async () => {
		if (!confirmDialog.videoId) return
		const videoId = confirmDialog.videoId

		setDeletingId(videoId)
		setConfirmDialog({ open: false, videoId: null })

		try {
			const response = await fetch(`/api/admin/ad-videos/${videoId}`, {
				method: 'DELETE',
			})
			if (!response.ok) throw new Error('Failed to delete')
			setVideos(prev => prev.filter(v => v.id !== videoId))
			showSuccess('Տեսանյութը հաջողությամբ ջնջվեց')
		} catch (error) {
			showError('Չհաջողվեց ջնջել տեսանյութը')
		} finally {
			setDeletingId(null)
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('hy-AM', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<AdminLayout>
			<ToastContainer toasts={toasts} onRemove={removeToast} />

			<AlertDialog
				open={confirmDialog.open}
				onOpenChange={open => setConfirmDialog({ ...confirmDialog, open })}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Հաստատե՞լ ջնջումը</AlertDialogTitle>
						<AlertDialogDescription>
							Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս տեսանյութը։
							<br />
							Այս գործողությունը հնարավոր չէ հետարկել։
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Չեղարկել</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className='bg-red-600 text-white hover:bg-red-700'
						>
							Այո, ջնջել
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className='space-y-6'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
					<div>
						<h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
							Գովազդային տեսանյութեր
						</h1>
						<p className='text-sm text-gray-500 mt-1'>
							{videos.length} տեսանյութ
						</p>
					</div>

					<div>
						<input
							type='file'
							accept='video/*'
							onChange={handleFileChange}
							className='hidden'
							ref={fileInputRef}
						/>
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
							className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center'
						>
							{uploading ? (
								<>
									<Loader2 className='w-5 h-5 mr-2 animate-spin' />
									Վերբեռնվում է...
								</>
							) : (
								<>
									<Plus className='w-5 h-5 mr-2' />
									Ավելացնել տեսանյութ
								</>
							)}
						</button>
					</div>
				</div>

				{uploading && (
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3'>
						<Loader2 className='w-5 h-5 text-blue-600 animate-spin flex-shrink-0' />
						<div>
							<p className='text-sm font-medium text-blue-800'>
								Տեսանյութը վերբեռնվում է...
							</p>
							<p className='text-xs text-blue-600'>
								Խնդրում ենք սպասել, կախված ֆայլի չափից կարող է տևել մի քանի րոպե
							</p>
						</div>
					</div>
				)}

				{/* Content */}
				{loading ? (
					<div className='flex items-center justify-center min-h-64'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900' />
					</div>
				) : videos.length === 0 ? (
					<div className='bg-white rounded-lg shadow p-16 text-center'>
						<Video className='w-16 h-16 text-gray-300 mx-auto mb-4' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							Տեսանյութեր չկան
						</h3>
						<p className='text-gray-500 mb-6'>
							Ավելացրեք առաջին գովազդային տեսանյութը
						</p>
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
							className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
						>
							<Upload className='w-5 h-5 mr-2' />
							Ներբեռնել տեսանյութ
						</button>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{videos.map(video => (
							<div
								key={video.id}
								className={`bg-white rounded-lg shadow overflow-hidden transition-opacity ${
									deletingId === video.id ? 'opacity-50' : ''
								}`}
							>
								<div className='relative bg-black aspect-video'>
									<video
										src={video.url}
										className='w-full h-full object-contain'
										controls
										preload='metadata'
									/>
								</div>
								<div className='p-3 flex items-center justify-between'>
									<span className='text-xs text-gray-500'>
										{formatDate(video.created_at)}
									</span>
									<button
										onClick={() => handleRequestDelete(video.id)}
										disabled={deletingId === video.id}
										className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
										title='Ջնջել'
									>
										{deletingId === video.id ? (
											<Loader2 className='w-4 h-4 animate-spin' />
										) : (
											<Trash2 className='w-4 h-4' />
										)}
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</AdminLayout>
	)
}
