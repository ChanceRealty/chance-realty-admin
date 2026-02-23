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

interface MediaUploadIntegratedProps {
	onMediaChange: (files: File[], types: string[], primaryIndex: number) => void
}

export default function MediaUploadIntegrated({
	onMediaChange,
}: MediaUploadIntegratedProps) {
	const [files, setFiles] = useState<File[]>([])
	const [fileTypes, setFileTypes] = useState<string[]>([])
	const [previews, setPreviews] = useState<string[]>([])
	const [primaryIndex, setPrimaryIndex] = useState(0)
	const [fileIds, setFileIds] = useState<string[]>([])
	const [error, setError] = useState('')
	const [dragActive, setDragActive] = useState(false)
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	  const filesRef = useRef<File[]>([])
		const fileTypesRef = useRef<string[]>([])
		const previewsRef = useRef<string[]>([])
		const fileIdsRef = useRef<string[]>([])

		// Keep refs in sync
		useEffect(() => {
			filesRef.current = files
		}, [files])
		useEffect(() => {
			fileTypesRef.current = fileTypes
		}, [fileTypes])
		useEffect(() => {
			previewsRef.current = previews
		}, [previews])
		useEffect(() => {
			fileIdsRef.current = fileIds
		}, [fileIds])

	// Cleanup function to revoke all blob URLs
	const cleanupPreviews = (urlsToCleanup: string[]) => {
		urlsToCleanup.forEach(url => {
			if (url.startsWith('blob:')) {
				URL.revokeObjectURL(url)
			}
		})
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanupPreviews(previews)
		}
	}, [])

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
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
		if (e.target.files && e.target.files.length > 0) {
			handleFiles(Array.from(e.target.files))
		}
	}

	const handleFiles = (newFiles: File[]) => {
		const validFiles: File[] = []
		const validTypes: string[] = []
		const newPreviews: string[] = []
		const newFileIds: string[] = [] 
		let errorMessage = ''

		// Process each file
		for (const file of newFiles) {
			// Check file types
			if (file.type.startsWith('image/')) {
				// Check image size (20MB limit for images)
				if (file.size > 20 * 1024 * 1024) {
					errorMessage = `Image "${file.name}" exceeds the 20MB size limit`
					continue
				}
				validFiles.push(file)
				validTypes.push('image')
				newPreviews.push(URL.createObjectURL(file))
				newFileIds.push(crypto.randomUUID())
			} else if (file.type.startsWith('video/')) {
				// Check video size (100MB limit for videos)
				if (file.size > 100 * 1024 * 1024) {
					errorMessage = `Video "${file.name}" exceeds the 100MB size limit`
					continue
				}
				validFiles.push(file)
				validTypes.push('video')
				newPreviews.push(URL.createObjectURL(file))
				newFileIds.push(crypto.randomUUID()) 
			} else {
				errorMessage = `File "${file.name}" is not a supported image or video format`
			}
		}

		if (errorMessage) {
			setError(errorMessage)
			cleanupPreviews(newPreviews)
			return
		}

		if (validFiles.length > 0) {
			const updatedFiles = [...files, ...validFiles]
			const updatedTypes = [...fileTypes, ...validTypes]
			const updatedPreviews = [...previews, ...newPreviews]
			const updatedIds = [...fileIdsRef.current, ...newFileIds]

			setFiles(updatedFiles)
			setFileTypes(updatedTypes)
			setPreviews(updatedPreviews)
			setFileIds(updatedIds)
			let newPrimaryIndex = 0 

			setPrimaryIndex(newPrimaryIndex)
			onMediaChange(updatedFiles, updatedTypes, newPrimaryIndex)
		}
	}

	const handleRemove = (id: string) => {
		// ← takes ID now, not index
		const currentIds = fileIdsRef.current
		const currentFiles = filesRef.current
		const currentTypes = fileTypesRef.current
		const currentPreviews = previewsRef.current

		const index = currentIds.indexOf(id)
		if (index === -1) return // already removed or not found

		// Revoke the blob URL to free memory
		const urlToRevoke = currentPreviews[index]
		if (urlToRevoke?.startsWith('blob:')) {
			URL.revokeObjectURL(urlToRevoke)
		}

		const updatedFiles = currentFiles.filter((_, i) => i !== index)
		const updatedTypes = currentTypes.filter((_, i) => i !== index)
		const updatedPreviews = currentPreviews.filter((_, i) => i !== index)
		const updatedIds = currentIds.filter((_, i) => i !== index)

		setFiles(updatedFiles)
		setFileTypes(updatedTypes)
		setPreviews(updatedPreviews)
		setFileIds(updatedIds)

		const newPrimaryIndex = 0
		setPrimaryIndex(newPrimaryIndex)
		onMediaChange(updatedFiles, updatedTypes, newPrimaryIndex)
	}

	const handleSetPrimary = (index: number) => {
		if (fileTypes[index] === 'image') {
			setPrimaryIndex(index)
			onMediaChange(files, fileTypes, index)
		}
	}

	// Clear all files and cleanup URLs
	const handleClearAll = () => {
		cleanupPreviews(previews)
		setFiles([])
		setFileTypes([])
		setPreviews([])
		setFileIds([]) // ← ADD THIS
		setPrimaryIndex(0)
		setError('')
		onMediaChange([], [], 0)
	}

	// Handle drag start for reordering
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
	}

	// Handle drag over for reordering
	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'

		if (draggedIndex === null || draggedIndex === index) return

		setDragOverIndex(index)
	}

	// Handle drag leave
	const handleDragLeave = () => {
		setDragOverIndex(null)
	}

	// Handle drop for reordering
	const handleDropReorder = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		e.stopPropagation()

		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDraggedIndex(null)
			setDragOverIndex(null)
			return
		}

		// Create new arrays with reordered items
		const newFiles = [...files]
		const newTypes = [...fileTypes]
		const newPreviews = [...previews]

		// Remove dragged item
		const [draggedFile] = newFiles.splice(draggedIndex, 1)
		const [draggedType] = newTypes.splice(draggedIndex, 1)
		const [draggedPreview] = newPreviews.splice(draggedIndex, 1)

		// Insert at new position
		newFiles.splice(dropIndex, 0, draggedFile)
		newTypes.splice(dropIndex, 0, draggedType)
		newPreviews.splice(dropIndex, 0, draggedPreview)

		// Update primary index if needed
		let newPrimaryIndex = 0 // всегда первый элемент становится primary

		setFiles(newFiles)
		setFileTypes(newTypes)
		setPreviews(newPreviews)
		setPrimaryIndex(newPrimaryIndex)
		setDraggedIndex(null)
		setDragOverIndex(null)

		onMediaChange(newFiles, newTypes, newPrimaryIndex)
	}

	// Handle drag end
	const handleDragEnd = () => {
		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	return (
		<div className='space-y-4'>
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
						Քաշեք և թողեք պատկերներ կամ տեսանյութեր այստեղ, կամ սեղմեք՝ զննելու
						համար
					</p>
					<p className='text-sm text-gray-400'>
						Առավելագույն ֆայլի չափը՝ 20 ՄԲ պատկերների համար, 100 ՄԲ տեսանյութերի
						համար
					</p>
					<input
						type='file'
						multiple
						accept='image/*,video/*'
						onChange={handleFileChange}
						className='hidden'
						ref={fileInputRef}
					/>
					<div className='flex gap-2'>
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
						>
							Ընտրեք Ֆայլեր
						</button>
						{files.length > 0 && (
							<button
								type='button'
								onClick={handleClearAll}
								className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
							>
								Մաքրել Բոլորը
							</button>
						)}
					</div>
				</div>
			</div>

			{error && (
				<div className='bg-red-50 text-red-700 p-3 rounded-lg flex items-center'>
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

			{previews.length > 0 && (
				<div>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						{previews.map((preview, index) => (
							<div
								key={fileIds[index]}
								className={`relative group rounded-lg overflow-hidden cursor-move transition-all ${
									draggedIndex === index ? 'opacity-50 scale-95' : ''
								} ${
									dragOverIndex === index
										? 'ring-2 ring-blue-500 scale-105'
										: ''
								}`}
								draggable
								onDragStart={e => handleDragStart(e, index)}
								onDragOver={e => handleDragOver(e, index)}
								onDragLeave={handleDragLeave}
								onDrop={e => handleDropReorder(e, index)}
								onDragEnd={handleDragEnd}
							>
								{/* Order number badge */}
								<div className='absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-semibold'>
									#{index + 1}
								</div>

								{fileTypes[index] === 'image' ? (
									<div className='aspect-square relative'>
										<Image
											src={preview}
											alt={`Media preview ${index + 1}`}
											fill
											className='object-cover'
											unoptimized
										/>
									</div>
								) : (
									<div className='aspect-square relative bg-gray-900'>
										<video
											src={preview}
											className='w-full h-full object-cover'
											preload='metadata'
										/>
										{/* Play icon overlay */}
										<div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
											<div className='w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center'>
												<Video className='w-6 h-6 text-gray-700' />
											</div>
										</div>
										<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2'>
											<div className='text-white text-xs text-center truncate'>
												{files[index]?.name}
											</div>
										</div>
									</div>
								)}

								{/* Primary badge */}
								{primaryIndex === index && fileTypes[index] === 'image' && (
									<div className='absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center'>
										<Check className='w-3 h-3 mr-1' />
										Գլխավոր
									</div>
								)}

								{/* Action buttons */}
								<div className='absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-80 transition-opacity flex items-center justify-center gap-2'>
									<button
										type='button'
										onClick={() => handleRemove(fileIds[index])}
										className='p-2 bg-red-600 text-white rounded-full hover:bg-red-700'
										title='Remove media'
									>
										<Trash2 className='w-4 h-4' />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
