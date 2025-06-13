// src/components/TranslationManager.tsx
'use client'

import { useState, useEffect } from 'react'
import {
	Globe,
	RefreshCw,
	Check,
	X,
	AlertCircle,
	Languages,
	Edit,
	Save,
	Eye,
	MoreHorizontal,
} from 'lucide-react'

interface TranslationStatus {
	id: number
	custom_id: string
	title: string
	translation_status: 'pending' | 'translating' | 'completed' | 'failed'
	translation_coverage: 'complete' | 'partial' | 'none'
	has_russian: boolean
	has_english: boolean
	last_translated_at?: string
}

interface PropertyTranslations {
	property: {
		id: number
		title: string
		title_ru?: string
		title_en?: string
		description?: string
		description_ru?: string
		description_en?: string
		translation_status: string
		last_translated_at?: string
		translation_error?: string
	}
	translations: Array<{
		language_code: string
		field_name: string
		translated_text: string
		translation_source: string
		created_at: string
		updated_at: string
	}>
}

export default function TranslationManager() {
	const [properties, setProperties] = useState<TranslationStatus[]>([])
	const [selectedProperty, setSelectedProperty] =
		useState<PropertyTranslations | null>(null)
	const [loading, setLoading] = useState(true)
	const [translating, setTranslating] = useState<Set<number>>(new Set())
	const [editingProperty, setEditingProperty] = useState<number | null>(null)
	const [editForm, setEditForm] = useState({
		title_ru: '',
		title_en: '',
		description_ru: '',
		description_en: '',
	})

	useEffect(() => {
		fetchTranslationOverview()
	}, [])

	const fetchTranslationOverview = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/admin/translations')
			if (response.ok) {
				const data = await response.json()
				setProperties(data)
			}
		} catch (error) {
			console.error('Error fetching translation overview:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchPropertyTranslations = async (propertyId: number) => {
		try {
			const response = await fetch(
				`/api/admin/translations?propertyId=${propertyId}`
			)
			if (response.ok) {
				const data = await response.json()
				setSelectedProperty(data)
			}
		} catch (error) {
			console.error('Error fetching property translations:', error)
		}
	}

	const retranslateProperty = async (propertyId: number) => {
		try {
			setTranslating(prev => new Set(prev).add(propertyId))

			const response = await fetch('/api/admin/translations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'retranslate',
					propertyId,
				}),
			})

			if (response.ok) {
				await fetchTranslationOverview()
				if (selectedProperty?.property.id === propertyId) {
					await fetchPropertyTranslations(propertyId)
				}
			}
		} catch (error) {
			console.error('Error retranslating property:', error)
		} finally {
			setTranslating(prev => {
				const newSet = new Set(prev)
				newSet.delete(propertyId)
				return newSet
			})
		}
	}

	const batchTranslateMissing = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/admin/translations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'translate_missing' }),
			})

			if (response.ok) {
				const result = await response.json()
				alert(
					`Batch translation completed: ${result.summary.successful} successful, ${result.summary.failed} failed`
				)
				await fetchTranslationOverview()
			}
		} catch (error) {
			console.error('Error batch translating:', error)
			alert('Batch translation failed')
		} finally {
			setLoading(false)
		}
	}

	const startEditTranslation = (property: any) => {
		setEditingProperty(property.id)
		setEditForm({
			title_ru: property.title_ru || '',
			title_en: property.title_en || '',
			description_ru: property.description_ru || '',
			description_en: property.description_en || '',
		})
	}

	const saveManualTranslation = async () => {
		if (!editingProperty) return

		try {
			const response = await fetch(
				`/api/admin/translations/${editingProperty}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(editForm),
				}
			)

			if (response.ok) {
				setEditingProperty(null)
				await fetchTranslationOverview()
				if (selectedProperty?.property.id === editingProperty) {
					await fetchPropertyTranslations(editingProperty)
				}
			}
		} catch (error) {
			console.error('Error saving manual translation:', error)
		}
	}

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			completed: { color: 'bg-green-100 text-green-800', icon: Check },
			pending: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
			translating: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
			failed: { color: 'bg-red-100 text-red-800', icon: X },
		}

		const config =
			statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
		const Icon = config.icon

		return (
			<span
				className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${config.color}`}
			>
				<Icon className='w-3 h-3 mr-1' />
				{status}
			</span>
		)
	}

	const getCoverageBadge = (
		coverage: string,
		hasRussian: boolean,
		hasEnglish: boolean
	) => {
		if (coverage === 'complete') {
			return <span className='text-green-600 text-sm'>🇷🇺 🇬🇧 Complete</span>
		} else if (coverage === 'partial') {
			return (
				<span className='text-orange-600 text-sm'>
					{hasRussian ? '🇷🇺' : '❌'} {hasEnglish ? '🇬🇧' : '❌'} Partial
				</span>
			)
		}
		return <span className='text-gray-600 text-sm'>❌ ❌ None</span>
	}

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-96'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900 flex items-center'>
						<Languages className='w-6 h-6 mr-2' />
						Translation Management
					</h1>
					<p className='text-gray-500'>
						Manage property translations for Russian and English
					</p>
				</div>
				<div className='flex gap-2'>
					<button
						onClick={fetchTranslationOverview}
						className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center'
					>
						<RefreshCw className='w-4 h-4 mr-2' />
						Refresh
					</button>
					<button
						onClick={batchTranslateMissing}
						className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center'
					>
						<Globe className='w-4 h-4 mr-2' />
						Translate Missing
					</button>
				</div>
			</div>

			{/* Summary Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				{[
					{
						label: 'Total Properties',
						value: properties.length,
						color: 'bg-blue-100 text-blue-800',
					},
					{
						label: 'Fully Translated',
						value: properties.filter(p => p.translation_coverage === 'complete')
							.length,
						color: 'bg-green-100 text-green-800',
					},
					{
						label: 'Partially Translated',
						value: properties.filter(p => p.translation_coverage === 'partial')
							.length,
						color: 'bg-orange-100 text-orange-800',
					},
					{
						label: 'Not Translated',
						value: properties.filter(p => p.translation_coverage === 'none')
							.length,
						color: 'bg-red-100 text-red-800',
					},
				].map((stat, index) => (
					<div key={index} className='bg-white p-4 rounded-lg shadow'>
						<div className='text-sm text-gray-500'>{stat.label}</div>
						<div
							className={`text-2xl font-bold px-2 py-1 rounded ${stat.color}`}
						>
							{stat.value}
						</div>
					</div>
				))}
			</div>

			{/* Properties Table */}
			<div className='bg-white rounded-lg shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Property
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Translation Status
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Coverage
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Last Translated
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{properties.map(property => (
								<tr key={property.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div>
											<div className='text-sm font-medium text-gray-900'>
												{property.title}
											</div>
											<div className='text-sm text-gray-500'>
												ID: {property.custom_id}
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										{getStatusBadge(property.translation_status)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										{getCoverageBadge(
											property.translation_coverage,
											property.has_russian,
											property.has_english
										)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{property.last_translated_at
											? new Date(
													property.last_translated_at
											  ).toLocaleDateString()
											: 'Never'}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
										<div className='flex space-x-2'>
											<button
												onClick={() => fetchPropertyTranslations(property.id)}
												className='text-indigo-600 hover:text-indigo-900'
												title='View details'
											>
												<Eye className='w-4 h-4' />
											</button>
											<button
												onClick={() => retranslateProperty(property.id)}
												disabled={translating.has(property.id)}
												className='text-blue-600 hover:text-blue-900 disabled:opacity-50'
												title='Retranslate'
											>
												{translating.has(property.id) ? (
													<RefreshCw className='w-4 h-4 animate-spin' />
												) : (
													<RefreshCw className='w-4 h-4' />
												)}
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Property Details Modal */}
			{selectedProperty && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg p-6 max-w-4xl w-full max-h-96 overflow-y-auto'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-bold'>Translation Details</h2>
							<button
								onClick={() => setSelectedProperty(null)}
								className='text-gray-400 hover:text-gray-600'
							>
								<X className='w-6 h-6' />
							</button>
						</div>

						<div className='space-y-6'>
							{/* Property Info */}
							<div>
								<h3 className='text-lg font-semibold mb-2'>
									Property Information
								</h3>
								<div className='bg-gray-50 p-4 rounded-lg'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<label className='block text-sm font-medium text-gray-700'>
												Original Title (Armenian)
											</label>
											<div className='text-sm text-gray-900'>
												{selectedProperty.property.title}
											</div>
										</div>
										<div>
											<label className='block text-sm font-medium text-gray-700'>
												Translation Status
											</label>
											<div>
												{getStatusBadge(
													selectedProperty.property.translation_status
												)}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Translations */}
							<div>
								<div className='flex justify-between items-center mb-2'>
									<h3 className='text-lg font-semibold'>Translations</h3>
									<button
										onClick={() =>
											startEditTranslation(selectedProperty.property)
										}
										className='px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center'
									>
										<Edit className='w-3 h-3 mr-1' />
										Edit
									</button>
								</div>

								{editingProperty === selectedProperty.property.id ? (
									/* Edit Form */
									<div className='space-y-4 border p-4 rounded-lg'>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													Russian Title
												</label>
												<input
													type='text'
													value={editForm.title_ru}
													onChange={e =>
														setEditForm({
															...editForm,
															title_ru: e.target.value,
														})
													}
													className='w-full border border-gray-300 rounded px-3 py-2 text-sm'
												/>
											</div>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													English Title
												</label>
												<input
													type='text'
													value={editForm.title_en}
													onChange={e =>
														setEditForm({
															...editForm,
															title_en: e.target.value,
														})
													}
													className='w-full border border-gray-300 rounded px-3 py-2 text-sm'
												/>
											</div>
										</div>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													Russian Description
												</label>
												<textarea
													value={editForm.description_ru}
													onChange={e =>
														setEditForm({
															...editForm,
															description_ru: e.target.value,
														})
													}
													className='w-full border border-gray-300 rounded px-3 py-2 text-sm'
													rows={3}
												/>
											</div>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													English Description
												</label>
												<textarea
													value={editForm.description_en}
													onChange={e =>
														setEditForm({
															...editForm,
															description_en: e.target.value,
														})
													}
													className='w-full border border-gray-300 rounded px-3 py-2 text-sm'
													rows={3}
												/>
											</div>
										</div>
										<div className='flex gap-2'>
											<button
												onClick={saveManualTranslation}
												className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center'
											>
												<Save className='w-4 h-4 mr-1' />
												Save
											</button>
											<button
												onClick={() => setEditingProperty(null)}
												className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									/* View Mode */
									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
										<div className='space-y-4'>
											<h4 className='font-medium text-gray-900 flex items-center'>
												🇷🇺 Russian
											</h4>
											<div>
												<label className='block text-xs font-medium text-gray-500'>
													Title
												</label>
												<div className='text-sm text-gray-900 bg-gray-50 p-2 rounded'>
													{selectedProperty.property.title_ru ||
														'Not translated'}
												</div>
											</div>
											<div>
												<label className='block text-xs font-medium text-gray-500'>
													Description
												</label>
												<div className='text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto'>
													{selectedProperty.property.description_ru ||
														'Not translated'}
												</div>
											</div>
										</div>

										<div className='space-y-4'>
											<h4 className='font-medium text-gray-900 flex items-center'>
												🇬🇧 English
											</h4>
											<div>
												<label className='block text-xs font-medium text-gray-500'>
													Title
												</label>
												<div className='text-sm text-gray-900 bg-gray-50 p-2 rounded'>
													{selectedProperty.property.title_en ||
														'Not translated'}
												</div>
											</div>
											<div>
												<label className='block text-xs font-medium text-gray-500'>
													Description
												</label>
												<div className='text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto'>
													{selectedProperty.property.description_en ||
														'Not translated'}
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Translation History */}
							{selectedProperty.translations.length > 0 && (
								<div>
									<h3 className='text-lg font-semibold mb-2'>
										Translation History
									</h3>
									<div className='overflow-x-auto'>
										<table className='min-w-full text-sm'>
											<thead className='bg-gray-50'>
												<tr>
													<th className='px-3 py-2 text-left'>Language</th>
													<th className='px-3 py-2 text-left'>Field</th>
													<th className='px-3 py-2 text-left'>Source</th>
													<th className='px-3 py-2 text-left'>Updated</th>
												</tr>
											</thead>
											<tbody className='divide-y divide-gray-200'>
												{selectedProperty.translations.map(
													(translation, index) => (
														<tr key={index}>
															<td className='px-3 py-2'>
																{translation.language_code === 'ru'
																	? '🇷🇺 Russian'
																	: '🇬🇧 English'}
															</td>
															<td className='px-3 py-2 capitalize'>
																{translation.field_name}
															</td>
															<td className='px-3 py-2'>
																<span
																	className={`px-2 py-1 rounded text-xs ${
																		translation.translation_source === 'google'
																			? 'bg-blue-100 text-blue-800'
																			: 'bg-green-100 text-green-800'
																	}`}
																>
																	{translation.translation_source}
																</span>
															</td>
															<td className='px-3 py-2'>
																{new Date(
																	translation.updated_at
																).toLocaleDateString()}
															</td>
														</tr>
													)
												)}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
