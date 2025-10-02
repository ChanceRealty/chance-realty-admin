'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
	Upload,
	Video,
	Check,
	Trash2,
	Star,
	AlertCircle,
	GripVertical,
} from 'lucide-react'

interface ExistingMedia {
	id: number
	url: string
	thumbnail_url?: string
	type: 'image' | 'video'
	is_primary: boolean
	display_order: number
}

interface CombinedMediaItem {
	id?: number
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
	onSetPrimaryExisting: (mediaId: number) => void
}

export default function MediaEditManager({
	existingMedia,
	onExistingMediaChange,
	onNewMediaChange,
	onDeleteExisting,
	onSetPrimaryExisting,
}: MediaEditManagerProps) {
	const [newFiles, setNewFiles] = useState<File[]>([])
	const [newFileTypes, setNewFileTypes] = useState<string[]>([])
	const [newPreviews, setNewPreviews] = useState<string[]>([])
	const [newPrimaryIndex, setNewPrimaryIndex] = useState(0)
	const [error, setError] = useState('')
	const [dragActive, setDragActive] = useState(false)
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
	const [combinedMediaState, setCombinedMediaState] = useState<
		CombinedMediaItem[]
	>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		// Только если пришло новое existingMedia (например после загрузки страницы)
		if (
			combinedMediaState.length === 0 &&
			(existingMedia.length > 0 || newFiles.length > 0)
		) {
			const hasExistingPrimary = existingMedia.some(m => m.is_primary)

			const combined: CombinedMediaItem[] = [
				...existingMedia.map(m => ({
					...m,
					isNew: false,
				})),
				...newFiles.map((file, idx) => ({
					url: newPreviews[idx],
					type: newFileTypes[idx] as 'image' | 'video',
					is_primary: !hasExistingPrimary && idx === 0,
					display_order: existingMedia.length + idx,
					isNew: true,
					file: file,
				})),
			]

			setCombinedMediaState(normalizePrimary(combined))
		}
	}, [existingMedia]) // ✅ не зависит от newFiles, иначе будет ресет при каждом добавлении

	// Универсальная функция — гарантирует что индекс 0 = primary
	const normalizePrimary = (
		items: CombinedMediaItem[]
	): CombinedMediaItem[] => {
		return items.map((item, idx) => ({
			...item,
			is_primary: idx === 0,
			display_order: idx,
		}))
	}

	const cleanupPreviews = (urlsToCleanup: string[]) => {
		urlsToCleanup.forEach(url => {
			if (url.startsWith('blob:')) URL.revokeObjectURL(url)
		})
	}

	useEffect(() => {
		return () => cleanupPreviews(newPreviews)
	}, [])

	// Drag & drop для загрузки файлов
	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
		else if (e.type === 'dragleave') setDragActive(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFiles(Array.from(e.dataTransfer.files))
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0)
			handleFiles(Array.from(e.target.files))
	}

	const handleFiles = (files: File[]) => {
		const validFiles: File[] = []
		const validTypes: string[] = []
		const previews: string[] = []
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
			} else if (file.type.startsWith('video/')) {
				if (file.size > 100 * 1024 * 1024) {
					errorMessage = `Video "${file.name}" exceeds 100MB`
					continue
				}
				validFiles.push(file)
				validTypes.push('video')
				previews.push(URL.createObjectURL(file))
			} else {
				errorMessage = `File "${file.name}" is not supported`
			}
		}

		if (errorMessage) {
			setError(errorMessage)
			cleanupPreviews(previews)
			return
		}

		if (validFiles.length > 0) {
			const newItems: CombinedMediaItem[] = validFiles.map((file, idx) => ({
				url: previews[idx],
				type: validTypes[idx] as 'image' | 'video',
				is_primary: false, // primary теперь решается логикой позже
				display_order: combinedMediaState.length + idx,
				isNew: true,
				file,
			}))

			// просто добавляем в combinedMediaState
			setCombinedMediaState(prev => normalizePrimary([...prev, ...newItems])) // ✅
		}
	}

	// Удаление нового файла
	const handleRemoveNew = (index: number) => {
		const url = newPreviews[index]
		if (url?.startsWith('blob:')) URL.revokeObjectURL(url)

		const updatedFiles = newFiles.filter((_, i) => i !== index)
		const updatedTypes = newFileTypes.filter((_, i) => i !== index)
		const updatedPreviews = newPreviews.filter((_, i) => i !== index)
		setNewFiles(updatedFiles)
		setNewFileTypes(updatedTypes)
		setNewPreviews(updatedPreviews)

		let primaryIndex = newPrimaryIndex
		primaryIndex = 0 

		setNewPrimaryIndex(primaryIndex)
		onNewMediaChange(updatedFiles, updatedTypes, primaryIndex)
	}

	const handleSetNewPrimary = (index: number) => {
		setNewPrimaryIndex(index)
		onNewMediaChange(newFiles, newFileTypes, index)
	}

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		if (draggedIndex === null || draggedIndex === index) return
		setDragOverIndex(index)
	}

	const handleDropMedia = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		if (draggedIndex === null || draggedIndex === index) return

		const reordered = [...combinedMediaState]
		const [draggedItem] = reordered.splice(draggedIndex, 1)
		reordered.splice(index, 0, draggedItem)
		setCombinedMediaState(normalizePrimary(reordered))

		// Разделяем обратно на existing и new
		const updatedExisting: ExistingMedia[] = []
		const updatedNewFiles: File[] = []
		const updatedNewTypes: string[] = []
		const updatedNewPreviews: string[] = []

		reordered.forEach((item, idx) => {
			if (item.isNew && item.file) {
				updatedNewFiles.push(item.file)
				updatedNewTypes.push(item.type)
				updatedNewPreviews.push(item.url)
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

		setNewFiles(updatedNewFiles)
		setNewFileTypes(updatedNewTypes)
		setNewPreviews(updatedNewPreviews)
		onExistingMediaChange(updatedExisting)
		onNewMediaChange(updatedNewFiles, updatedNewTypes, 0)

		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	const handleDragEnd = () => {
		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	return (
		<div className='space-y-6'>
			{/* Медиа-сетка */}
			{combinedMediaState.length > 0 && (
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					{combinedMediaState.map((media, index) => (
						<div
							key={media.isNew ? `new-${index}` : `existing-${media.id}`}
							className={`relative group rounded-lg overflow-hidden cursor-move transition-all ${
								draggedIndex === index ? 'opacity-50 scale-95' : ''
							} ${
								dragOverIndex === index ? 'ring-2 ring-blue-500 scale-105' : ''
							}`}
							draggable
							onDragStart={e => handleDragStart(e, index)}
							onDragOver={e => handleDragOver(e, index)}
							onDrop={e => handleDropMedia(e, index)}
							onDragEnd={handleDragEnd}
						>
							{/* Order badge */}
							<div className='absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-semibold'>
								#{index + 1}
								{media.isNew ? ' NEW' : ''}
							</div>

							{media.type === 'image' ? (
								<div className='aspect-square relative'>
									<Image
										src={media.url}
										alt={`Media ${index + 1}`}
										fill
										className='object-cover'
										unoptimized={media.isNew}
									/>
								</div>
							) : (
								<div className='aspect-square relative bg-gray-100 flex items-center justify-center'>
									<Video className='w-10 h-10 text-gray-500' />
								</div>
							)}

							{media.is_primary && (
								<div className='absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center'>
									<Check className='w-3 h-3 mr-1' /> Գլխավոր
								</div>
							)}

							<div className='absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
								{media.type === 'image' && !media.is_primary && (
									<button
										type='button'
										onClick={() =>
											media.isNew
												? handleSetNewPrimary(index - existingMedia.length)
												: onSetPrimaryExisting(media.id!)
										}
										className='p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700'
										title='Set as primary'
									>
										<Star className='w-4 h-4' />
									</button>
								)}

								<button
									type='button'
									onClick={() =>
										media.isNew
											? handleRemoveNew(index - existingMedia.length)
											: onDeleteExisting(media.id!)
									}
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

			{/* Upload Section */}
			<div
				className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
					dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
				}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
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
						onChange={handleFileChange}
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
