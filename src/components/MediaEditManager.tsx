'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Upload, Video, Check, Trash2, AlertCircle } from 'lucide-react'

interface ExistingMedia {
	id: number
	url: string
	thumbnail_url?: string
	type: 'image' | 'video'
	is_primary: boolean
	display_order: number
}

interface CombinedMediaItem {
	id: string | number
	url: string
	thumbnail_url?: string
	type: 'image' | 'video'
	is_primary: boolean
	display_order: number
	isNew: boolean
	file?: File
}

interface MediaEditManagerProps {
	existingMedia: ExistingMedia[]
	onExistingMediaChange: (media: ExistingMedia[]) => void
	onNewMediaChange: (
		files: File[],
		types: string[],
		primaryIndex: number
	) => void
	onDeleteExisting: (mediaId: number) => void
}

export default function MediaEditManager({
	existingMedia,
	onExistingMediaChange,
	onNewMediaChange,
	onDeleteExisting,
}: MediaEditManagerProps) {
	const [newFiles, setNewFiles] = useState<File[]>([])
	const [newFileTypes, setNewFileTypes] = useState<string[]>([])
	const [newPreviews, setNewPreviews] = useState<string[]>([])
	const [newIds, setNewIds] = useState<string[]>([])
	const [error, setError] = useState('')
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
	const [combinedMediaState, setCombinedMediaState] = useState<
		CombinedMediaItem[]
	>([])
	const [isUpdatingFromDrop, setIsUpdatingFromDrop] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// 🔹 Генерация thumbnail для видео
	const generateVideoThumbnail = async (videoFile: File): Promise<string> => {
		return new Promise(resolve => {
			const video = document.createElement('video')
			const canvas = document.createElement('canvas')
			const ctx = canvas.getContext('2d')

			video.preload = 'metadata'
			video.muted = true
			video.playsInline = true

			video.onloadeddata = () => {
				canvas.width = 400
				canvas.height = 300
				video.currentTime = Math.min(1, video.duration * 0.1)
			}

			video.onseeked = () => {
				if (ctx) {
					const aspectRatio = video.videoWidth / video.videoHeight
					let drawWidth = canvas.width
					let drawHeight = canvas.height
					let offsetX = 0
					let offsetY = 0

					if (aspectRatio > canvas.width / canvas.height) {
						drawHeight = canvas.width / aspectRatio
						offsetY = (canvas.height - drawHeight) / 2
					} else {
						drawWidth = canvas.height * aspectRatio
						offsetX = (canvas.width - drawWidth) / 2
					}

					ctx.fillStyle = '#000'
					ctx.fillRect(0, 0, canvas.width, canvas.height)
					ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

					canvas.toBlob(
						blob => {
							resolve(
								blob
									? URL.createObjectURL(blob)
									: URL.createObjectURL(videoFile)
							)
						},
						'image/jpeg',
						0.8
					)
				}
				URL.revokeObjectURL(video.src)
			}

			video.onerror = () => resolve(URL.createObjectURL(videoFile))
			video.src = URL.createObjectURL(videoFile)
		})
	}

const normalizeCombinedState = (items: CombinedMediaItem[]): CombinedMediaItem[] => {
  return items.map((item, idx) => ({
    ...item,
    display_order: idx,
    is_primary: idx === 0, // первый всегда главный
  }));
};



	// 🔹 Обновляем combinedMediaState при изменении existingMedia / новых файлов
	useEffect(() => {
		if (isUpdatingFromDrop) return

		const combined: CombinedMediaItem[] = [
			...existingMedia.map(m => ({ ...m, isNew: false })),
			...newFiles.map((file, idx) => ({
				id: newIds[idx],
				url: newPreviews[idx],
				thumbnail_url: newPreviews[idx],
				type: newFileTypes[idx] as 'image' | 'video',
				is_primary: false,
				display_order: idx,
				isNew: true,
				file,
			})),
		]

		setCombinedMediaState(normalizeCombinedState(combined))
	}, [existingMedia, newFiles, newPreviews, newFileTypes, newIds])

	const cleanupPreviews = (urls: string[]) => {
		urls.forEach(url => url.startsWith('blob:') && URL.revokeObjectURL(url))
	}
	useEffect(() => () => cleanupPreviews(newPreviews), [])

	// 🔹 Обработка новых файлов
	const handleFiles = async (files: File[]) => {
		const validFiles: File[] = []
		const validTypes: string[] = []
		const previews: string[] = []
		const ids: string[] = []
		let errorMessage = ''

		for (const file of files) {
			if (file.type.startsWith('image/')) {
				if (file.size > 20 * 1024 * 1024) {
					errorMessage = `Image "${file.name}" exceeds 20MB`
					continue
				}
				validFiles.push(file)
				validTypes.push('image')
				previews.push(URL.createObjectURL(file))
				ids.push(crypto.randomUUID())
			} else if (file.type.startsWith('video/')) {
				if (file.size > 100 * 1024 * 1024) {
					errorMessage = `Video "${file.name}" exceeds 100MB`
					continue
				}
				validFiles.push(file)
				validTypes.push('video')
				previews.push(await generateVideoThumbnail(file))
				ids.push(crypto.randomUUID())
			} else {
				errorMessage = `File "${file.name}" is not supported`
			}
		}

		if (errorMessage) {
			setError(errorMessage)
			cleanupPreviews(previews)
			return
		}

		const updatedFiles = [...newFiles, ...validFiles]
		const updatedTypes = [...newFileTypes, ...validTypes]
		const updatedPreviews = [...newPreviews, ...previews]
		const updatedIds = [...newIds, ...ids]

		setNewFiles(updatedFiles)
		setNewFileTypes(updatedTypes)
		setNewPreviews(updatedPreviews)
		setNewIds(updatedIds)

		onNewMediaChange(updatedFiles, updatedTypes, 0)
	}

	// 🔹 Удаление медиа
	const handleDeleteMedia = (index: number) => {
		const mediaItem = combinedMediaState[index]
		if (mediaItem.isNew) {
			const newFileIndex = combinedMediaState
				.slice(0, index)
				.filter(i => i.isNew).length
			const updatedFiles = newFiles.filter((_, i) => i !== newFileIndex)
			const updatedTypes = newFileTypes.filter((_, i) => i !== newFileIndex)
			const updatedPreviews = newPreviews.filter((_, i) => i !== newFileIndex)
			const updatedIds = newIds.filter((_, i) => i !== newFileIndex)

			setNewFiles(updatedFiles)
			setNewFileTypes(updatedTypes)
			setNewPreviews(updatedPreviews)
			setNewIds(updatedIds)
			onNewMediaChange(updatedFiles, updatedTypes, 0)
		} else {
			onDeleteExisting(mediaItem.id as number)
		}
	}

	// 🔹 Drag'n'drop
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		if (draggedIndex === null || draggedIndex === index) return
		setDragOverIndex(index)
	}

	const handleDropMedia = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		if (draggedIndex === null || draggedIndex === index) return

		setIsUpdatingFromDrop(true)
		const reordered = [...combinedMediaState]
		const [draggedItem] = reordered.splice(draggedIndex, 1)
		reordered.splice(index, 0, draggedItem)

		const normalized = normalizeCombinedState(reordered)
		setCombinedMediaState(normalized)

		const updatedExisting: ExistingMedia[] = []
		const updatedNewFiles: File[] = []
		const updatedNewTypes: string[] = []
		const updatedNewPreviews: string[] = []
		const updatedNewIds: string[] = []

		normalized.forEach((item, idx) => {
			if (item.isNew && item.file) {
				updatedNewFiles.push(item.file)
				updatedNewTypes.push(item.type)
				updatedNewPreviews.push(item.url)
				updatedNewIds.push(item.id as string)
			} else if (!item.isNew && item.id) {
				updatedExisting.push({
					id: item.id as number,
					url: item.url,
					thumbnail_url: item.thumbnail_url,
					type: item.type,
					is_primary: item.is_primary,
					display_order: idx,
				})
			}
		})

		setTimeout(() => {
			setNewFiles(updatedNewFiles)
			setNewFileTypes(updatedNewTypes)
			setNewPreviews(updatedNewPreviews)
			setNewIds(updatedNewIds)
			onExistingMediaChange(
				updatedExisting.sort((a, b) => a.display_order - b.display_order)
			)
			let newPrimaryIndex = 0
			for (let i = 0; i < normalized.length; i++) {
				if (normalized[i].isNew && normalized[i].is_primary) {
					newPrimaryIndex = normalized.slice(0, i).filter(it => it.isNew).length
					break
				}
			}
			onNewMediaChange(updatedNewFiles, updatedNewTypes, newPrimaryIndex)

			setDraggedIndex(null)
			setDragOverIndex(null)
			setTimeout(() => setIsUpdatingFromDrop(false), 50)
		}, 0)
	}

	const handleDragEnd = () => {
		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	const renderMediaItem = (media: CombinedMediaItem, index: number) => {
		if (media.type === 'video') {
			return (
				<div className='aspect-square relative bg-gray-900'>
					<Image
						src={media.thumbnail_url || media.url}
						alt={`Video ${index + 1}`}
						fill
						className='object-cover'
						unoptimized
					/>
					<div className='absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold'>
						<Video size={20} />
					</div>
				</div>
			)
		}

		return (
			<div className='aspect-square relative'>
				<Image
					src={media.url}
					alt={`Media ${index + 1}`}
					fill
					className='object-cover'
					unoptimized={media.isNew}
				/>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{combinedMediaState.length > 0 && (
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					{combinedMediaState.map((media, index) => (
						<div
							key={media.id}
							className={`relative group rounded-lg overflow-hidden transition-all ${
								draggedIndex === index ? 'opacity-50 scale-95' : ''
							} ${
								dragOverIndex === index ? 'ring-2 ring-blue-500 scale-105' : ''
							}`}
							style={{ cursor: 'move' }}
							draggable
							onDragStart={e => handleDragStart(e, index)}
							onDragOver={e => handleDragOver(e, index)}
							onDrop={e => handleDropMedia(e, index)}
							onDragEnd={handleDragEnd}
						>
							<div className='absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-semibold'>
								#{index + 1}
								{media.isNew && ' Նոր'}
							</div>

							{renderMediaItem(media, index)}

							{media.is_primary && (
								<div className='absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center'>
									<Check className='w-3 h-3 mr-1' /> Գլխավոր
								</div>
							)}

							<div className='absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-80 transition-opacity flex items-center justify-center gap-2'>
								<button
									type='button'
									onClick={() => handleDeleteMedia(index)}
									className='p-2 bg-red-600 text-white rounded-full hover:bg-red-700'
									title='Delete'
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<div
				className={`border-2 border-dashed rounded-lg p-6 transition-colors`}
			>
				<div className='flex flex-col items-center justify-center space-y-2'>
					<Upload className='w-10 h-10 text-gray-400' />
					<p className='text-center text-gray-500'>
						Քաշեք և թողեք ֆայլերը կամ սեղմեք՝ ընտրելու համար
					</p>
					<p className='text-sm text-gray-400'>
						Մաքս. 20 ՄԲ նկարների, 100 ՄԲ տեսանյութերի համար
					</p>
					<input
						type='file'
						multiple
						accept='image/*,video/*'
						onChange={e =>
							e.target.files && handleFiles(Array.from(e.target.files))
						}
						className='hidden'
						ref={fileInputRef}
					/>
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
					>
						Ընտրեք ֆայլեր
					</button>
				</div>
				{error && (
					<div className='mt-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center'>
						<AlertCircle className='w-5 h-5 mr-2' />
						{error}
						<button
							onClick={() => setError('')}
							className='ml-auto text-red-500 hover:text-red-700'
						>
							×
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
