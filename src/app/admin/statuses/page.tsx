// src/app/admin/statuses/page.tsx - Status management interface
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit, Trash2, Save, X, Move, Eye, EyeOff } from 'lucide-react'

interface PropertyStatus {
	id: number
	name: string
	display_name: string
	display_name_armenian?: string
	color: string
	is_active: boolean
	sort_order: number
}

export default function StatusManagementPage() {
	const [statuses, setStatuses] = useState<PropertyStatus[]>([])
	const [loading, setLoading] = useState(true)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [showAddForm, setShowAddForm] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		display_name: '',
		display_name_armenian: '',
		color: '#gray',
		is_active: true,
		sort_order: 0,
	})

	const colorOptions = [
		{ value: '#gray', label: 'Gray', class: 'bg-gray-100 text-gray-800' },
		{ value: '#green', label: 'Green', class: 'bg-green-100 text-green-800' },
		{ value: '#blue', label: 'Blue', class: 'bg-blue-100 text-blue-800' },
		{ value: '#red', label: 'Red', class: 'bg-red-100 text-red-800' },
		{
			value: '#yellow',
			label: 'Yellow',
			class: 'bg-yellow-100 text-yellow-800',
		},
		{
			value: '#purple',
			label: 'Purple',
			class: 'bg-purple-100 text-purple-800',
		},
		{
			value: '#indigo',
			label: 'Indigo',
			class: 'bg-indigo-100 text-indigo-800',
		},
	]

	useEffect(() => {
		fetchStatuses()
	}, [])

	const fetchStatuses = async () => {
		try {
			const response = await fetch('/api/admin/statuses')
			if (response.ok) {
				const data = await response.json()
				setStatuses(data)
			}
		} catch (error) {
			console.error('Error fetching statuses:', error)
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setFormData({
			name: '',
			display_name: '',
			display_name_armenian: '',
			color: '#gray',
			is_active: true,
			sort_order: statuses.length,
		})
		setEditingId(null)
		setShowAddForm(false)
	}

	const handleEdit = (status: PropertyStatus) => {
		setFormData({
			name: status.name,
			display_name: status.display_name,
			display_name_armenian: status.display_name_armenian || '',
			color: status.color,
			is_active: status.is_active,
			sort_order: status.sort_order,
		})
		setEditingId(status.id)
		setShowAddForm(false)
	}

	const handleSave = async () => {
		try {
			const url = editingId
				? `/api/admin/statuses/${editingId}`
				: '/api/admin/statuses'
			const method = editingId ? 'PUT' : 'POST'

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			})

			if (response.ok) {
				await fetchStatuses()
				resetForm()
			} else {
				const error = await response.json()
				alert(error.error || 'Failed to save status')
			}
		} catch (error) {
			console.error('Error saving status:', error)
			alert('Failed to save status')
		}
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this status?')) {
			return
		}

		try {
			const response = await fetch(`/api/admin/statuses/${id}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				await fetchStatuses()
			} else {
				const error = await response.json()
				alert(error.error || 'Failed to delete status')
			}
		} catch (error) {
			console.error('Error deleting status:', error)
			alert('Failed to delete status')
		}
	}

	const handleToggleActive = async (status: PropertyStatus) => {
		try {
			const response = await fetch(`/api/admin/statuses/${status.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...status,
					is_active: !status.is_active,
				}),
			})

			if (response.ok) {
				await fetchStatuses()
			}
		} catch (error) {
			console.error('Error toggling status:', error)
		}
	}

	const getColorClass = (color: string) => {
		const colorOption = colorOptions.find(opt => opt.value === color)
		return colorOption?.class || 'bg-gray-100 text-gray-800'
	}

	if (loading) {
		return (
			<AdminLayout>
				<div className='flex items-center justify-center min-h-96'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
				</div>
			</AdminLayout>
		)
	}

	return (
		<AdminLayout>
			<div className='space-y-6'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>
							Status Management
						</h1>
						<p className='text-gray-500'>
							Manage property status options and their translations
						</p>
					</div>
					<button
						onClick={() => {
							resetForm()
							setShowAddForm(true)
						}}
						className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
					>
						<Plus className='w-5 h-5 mr-2' />
						Add Status
					</button>
				</div>

				{/* Add/Edit Form */}
				{(showAddForm || editingId) && (
					<div className='bg-white rounded-lg shadow p-6'>
						<h2 className='text-lg font-semibold mb-4'>
							{editingId ? 'Edit Status' : 'Add New Status'}
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Status Name (Code)
								</label>
								<input
									type='text'
									value={formData.name}
									onChange={e =>
										setFormData({ ...formData, name: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-4 py-2'
									placeholder='e.g., under_review'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Display Name (English)
								</label>
								<input
									type='text'
									value={formData.display_name}
									onChange={e =>
										setFormData({ ...formData, display_name: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-4 py-2'
									placeholder='e.g., Under Review'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Armenian Translation
								</label>
								<input
									type='text'
									value={formData.display_name_armenian}
									onChange={e =>
										setFormData({
											...formData,
											display_name_armenian: e.target.value,
										})
									}
									className='w-full border border-gray-300 rounded-lg px-4 py-2'
									placeholder='e.g., Վերանայման մեջ'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Color Theme
								</label>
								<select
									value={formData.color}
									onChange={e =>
										setFormData({ ...formData, color: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-4 py-2'
								>
									{colorOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Sort Order
								</label>
								<input
									type='number'
									value={formData.sort_order}
									onChange={e =>
										setFormData({
											...formData,
											sort_order: parseInt(e.target.value),
										})
									}
									className='w-full border border-gray-300 rounded-lg px-4 py-2'
									min='0'
								/>
							</div>

							<div className='flex items-center'>
								<input
									type='checkbox'
									checked={formData.is_active}
									onChange={e =>
										setFormData({ ...formData, is_active: e.target.checked })
									}
									className='w-4 h-4 text-blue-600 border-gray-300 rounded'
								/>
								<label className='ml-2 text-sm font-medium text-gray-700'>
									Active
								</label>
							</div>
						</div>

						<div className='flex justify-end space-x-4 mt-6'>
							<button
								onClick={resetForm}
								className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
							>
								<X className='w-4 h-4 mr-2 inline' />
								Cancel
							</button>
							<button
								onClick={handleSave}
								className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
							>
								<Save className='w-4 h-4 mr-2 inline' />
								Save
							</button>
						</div>
					</div>
				)}

				{/* Status List */}
				<div className='bg-white rounded-lg shadow overflow-hidden'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Status
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Translations
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Preview
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Order
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Active
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{statuses.map(status => (
								<tr
									key={status.id}
									className={!status.is_active ? 'opacity-50' : ''}
								>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div>
											<div className='text-sm font-medium text-gray-900'>
												{status.display_name}
											</div>
											<div className='text-sm text-gray-500'>
												Code: {status.name}
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm text-gray-900'>
											{status.display_name_armenian || 'No translation'}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColorClass(
												status.color
											)}`}
										>
											{status.display_name}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{status.sort_order}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<button
											onClick={() => handleToggleActive(status)}
											className={`p-1 rounded ${
												status.is_active ? 'text-green-600' : 'text-gray-400'
											}`}
										>
											{status.is_active ? (
												<Eye className='w-5 h-5' />
											) : (
												<EyeOff className='w-5 h-5' />
											)}
										</button>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
										<div className='flex space-x-2'>
											<button
												onClick={() => handleEdit(status)}
												className='text-indigo-600 hover:text-indigo-900'
											>
												<Edit className='w-4 h-4' />
											</button>
											<button
												onClick={() => handleDelete(status.id)}
												className='text-red-600 hover:text-red-900'
											>
												<Trash2 className='w-4 h-4' />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</AdminLayout>
	)
}
