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
	const [error, setError] = useState('')
	const [dragActive, setDragActive] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

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
			} else if (file.type.startsWith('video/')) {
				// Check video size (100MB limit for videos)
				if (file.size > 100 * 1024 * 1024) {
					errorMessage = `Video "${file.name}" exceeds the 100MB size limit`
					continue
				}
				validFiles.push(file)
				validTypes.push('video')
				newPreviews.push(URL.createObjectURL(file))
			} else {
				errorMessage = `File "${file.name}" is not a supported image or video format`
			}
		}

		if (errorMessage) {
			setError(errorMessage)
			// Clean up newly created URLs on error
			cleanupPreviews(newPreviews)
			return
		}

		if (validFiles.length > 0) {
			// Append to existing files
			const updatedFiles = [...files, ...validFiles]
			const updatedTypes = [...fileTypes, ...validTypes]
			const updatedPreviews = [...previews, ...newPreviews]

			setFiles(updatedFiles)
			setFileTypes(updatedTypes)
			setPreviews(updatedPreviews)

			// If we just added the first file and it's an image, set it as primary
			if (files.length === 0 && validTypes[0] === 'image') {
				setPrimaryIndex(0)
			}

			// Notify parent component about change
			onMediaChange(updatedFiles, updatedTypes, primaryIndex)
		}
	}

	const handleRemove = (index: number) => {
		// Revoke the specific object URL to prevent memory leaks
		const urlToRevoke = previews[index]
		if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
			URL.revokeObjectURL(urlToRevoke)
		}

		// Create new arrays without the removed item
		const updatedFiles = files.filter((_, i) => i !== index)
		const updatedTypes = fileTypes.filter((_, i) => i !== index)
		const updatedPreviews = previews.filter((_, i) => i !== index)

		// Update state
		setFiles(updatedFiles)
		setFileTypes(updatedTypes)
		setPreviews(updatedPreviews)

		// Adjust primary index if needed
		let newPrimaryIndex = primaryIndex
		if (primaryIndex === index) {
			// Find the first image in the remaining files
			const firstImageIndex = updatedTypes.findIndex(type => type === 'image')
			newPrimaryIndex = firstImageIndex >= 0 ? firstImageIndex : 0
		} else if (primaryIndex > index) {
			newPrimaryIndex = primaryIndex - 1
		}

		setPrimaryIndex(newPrimaryIndex)

		// Notify parent component about change
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
		setPrimaryIndex(0)
		setError('')
		onMediaChange([], [], 0)
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
								Clear All
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
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					{previews.map((preview, index) => (
						<div
							key={`${index}-${files[index]?.name}`}
							className='relative group rounded-lg overflow-hidden'
						>
							{fileTypes[index] === 'image' ? (
								<div className='aspect-square relative'>
									<Image
										src={preview}
										alt={`Media preview ${index + 1}`}
										fill
										className='object-cover'
										unoptimized // Important for blob URLs
									/>
								</div>
							) : (
								<div className='aspect-square relative bg-gray-100 flex items-center justify-center'>
									<Video className='w-10 h-10 text-gray-500' />
									<div className='absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-70 text-white p-1 text-xs text-center'>
										Video: {files[index]?.name}
									</div>
								</div>
							)}

							{/* Primary badge */}
							{primaryIndex === index && fileTypes[index] === 'image' && (
								<div className='absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center'>
									<Check className='w-3 h-3 mr-1' />
									Primary
								</div>
							)}

							{/* Action buttons */}
							<div className='absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
								{fileTypes[index] === 'image' && primaryIndex !== index && (
									<button
										type='button'
										onClick={() => handleSetPrimary(index)}
										className='p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700'
										title='Set as primary image'
									>
										<Star className='w-4 h-4' />
									</button>
								)}
								<button
									type='button'
									onClick={() => handleRemove(index)}
									className='p-2 bg-red-600 text-white rounded-full hover:bg-red-700'
									title='Remove media'
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}