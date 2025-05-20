// src/app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import {
	Plus,
	Search,
	Edit,
	Trash2,
	Eye,
	Home,
	Building2,
	Landmark,
	Trees,
	Filter,
} from 'lucide-react'
import Image from 'next/image'

interface PropertyListItem {
	id: number
	custom_id?: string | number
	title: string
	property_type: string
	listing_type: string
	price: number
	status: string
	featured: boolean
	views: number
	created_at: string
	user_email: string
	state_name: string
	city_name: string
	primary_image?: string
}

export default function AdminDashboard() {
	const router = useRouter()
	const [properties, setProperties] = useState<PropertyListItem[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState({
		property_type: '',
		listing_type: '',
		status: '',
	})

	useEffect(() => {
		fetchProperties()
	}, [])

	const fetchProperties = async () => {
		try {
			const response = await fetch('/api/admin/properties')
			if (!response.ok) {
				throw new Error('Failed to fetch properties')
			}
			const data = await response.json()
			setProperties(data)
		} catch (error) {
			console.error('Error fetching properties:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredProperties = properties.filter(property => {
		// Convert search term to lowercase for case-insensitive comparison
		const search = searchTerm.toLowerCase().trim()

		if (search === '') {
			// Return all properties if search is empty (only apply other filters)
		} else {
			// Check if custom_id exists and matches search term
			let customIdMatches = false

			if (property.custom_id !== undefined && property.custom_id !== null) {
				// Convert to string explicitly - this handles both string and number types
				const customIdString = String(property.custom_id).toLowerCase()

				// Check for exact matches and substring matches
				customIdMatches =
					customIdString === search || customIdString.includes(search)
			}

			// If none of the fields match the search term, exclude this property
			if (
				!customIdMatches &&
				!property.title.toLowerCase().includes(search) &&
				!property.city_name.toLowerCase().includes(search) &&
				!property.state_name.toLowerCase().includes(search)
			) {
				return false
			}
		}

		// Apply property type filter
		const matchesPropertyType =
			filters.property_type === '' ||
			property.property_type === filters.property_type

		// Apply listing type filter
		const matchesListingType =
			filters.listing_type === '' ||
			property.listing_type === filters.listing_type

		// Apply status filter
		const matchesStatus =
			filters.status === '' || property.status === filters.status

		return (
			matchesPropertyType &&
			matchesListingType &&
			matchesStatus
		)
	})

	const propertyTypeIcons = {
		house: Home,
		apartment: Building2,
		commercial: Landmark,
		land: Trees,
	}

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price)
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'available':
				return 'bg-green-100 text-green-800'
			case 'sold':
				return 'bg-red-100 text-red-800'
			case 'rented':
				return 'bg-blue-100 text-blue-800'
			case 'pending':
				return 'bg-yellow-100 text-yellow-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const propertyTypeOptions = [
		{ value: '', label: 'All Types' },
		{ value: 'house', label: 'House' },
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'commercial', label: 'Commercial' },
		{ value: 'land', label: 'Land' },
	]

	const listingTypeOptions = [
		{ value: '', label: 'All Listings' },
		{ value: 'sale', label: 'For Sale' },
		{ value: 'rent', label: 'For Rent' },
		{ value: 'daily_rent', label: 'Daily Rent' },
	]

	const statusOptions = [
		{ value: '', label: 'All Status' },
		{ value: 'available', label: 'Available' },
		{ value: 'sold', label: 'Sold' },
		{ value: 'rented', label: 'Rented' },
		{ value: 'pending', label: 'Pending' },
	]

	return (
		<AdminLayout>
			<div className='space-y-6'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>Properties</h1>
						<p className='text-gray-500'>Manage your property listings</p>
					</div>
					<Link
						href='/admin/properties/add'
						className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
					>
						<Plus className='w-5 h-5 mr-2' />
						Add Property
					</Link>
				</div>

				{/* Search and Filter Bar */}
				<div className='bg-white rounded-lg shadow p-4'>
					<div className='flex flex-col md:flex-row gap-4'>
						<div className='relative flex-grow'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
							<input
								type='text'
								placeholder='Search by title, location, or property ID...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
						>
							<Filter className='w-5 h-5 mr-2' />
							Filters
						</button>
					</div>

					{/* Expanded Filters */}
					{showFilters && (
						<div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Property Type
								</label>
								<select
									value={filters.property_type}
									onChange={e =>
										setFilters({ ...filters, property_type: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									{propertyTypeOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Listing Type
								</label>
								<select
									value={filters.listing_type}
									onChange={e =>
										setFilters({ ...filters, listing_type: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									{listingTypeOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Status
								</label>
								<select
									value={filters.status}
									onChange={e =>
										setFilters({ ...filters, status: e.target.value })
									}
									className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									{statusOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div className='md:col-span-3'>
								<button
									onClick={() => {
										setFilters({
											property_type: '',
											listing_type: '',
											status: '',
										})
									}}
									className='text-blue-600 hover:text-blue-800 text-sm font-medium'
								>
									Clear Filters
								</button>
							</div>
						</div>
					)}
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
										ID
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Type
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Location
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Price
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Status
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Views
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200'>
								{loading ? (
									<tr>
										<td colSpan={8} className='px-6 py-4 text-center'>
											<div className='flex justify-center'>
												<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
											</div>
										</td>
									</tr>
								) : filteredProperties.length === 0 ? (
									<tr>
										<td
											colSpan={8}
											className='px-6 py-4 text-center text-gray-500'
										>
											No properties found
										</td>
									</tr>
								) : (
									filteredProperties.map(property => {
										const Icon =
											propertyTypeIcons[
												property.property_type as keyof typeof propertyTypeIcons
											] || Home
										return (
											<tr key={property.id} className='hover:bg-gray-50'>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='flex items-center'>
														<div className='h-10 w-10 flex-shrink-0'>
															{property.primary_image ? (
																<Image
																	src={property.primary_image}
																	alt={property.title}
																	width={40}
																	height={40}
																	className='h-10 w-10 rounded-lg object-cover'
																/>
															) : (
																<div className='h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center'>
																	<Icon className='h-5 w-5 text-gray-500' />
																</div>
															)}
														</div>
														<div className='ml-4'>
															<div className='text-sm font-medium text-gray-900'>
																{property.title}
															</div>
															<div className='text-sm text-gray-500'>
																{property.user_email}
															</div>
														</div>
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm font-medium text-gray-900'>
														{property.custom_id !== undefined &&
														property.custom_id !== null
															? String(property.custom_id)
															: '-'}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='flex items-center'>
														<Icon className='h-4 w-4 text-gray-400 mr-2' />
														<span className='text-sm text-gray-900'>
															{property.property_type.charAt(0).toUpperCase() +
																property.property_type.slice(1)}
														</span>
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm text-gray-900'>
														{property.city_name}
													</div>
													<div className='text-sm text-gray-500'>
														{property.state_name}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm text-gray-900'>
														{formatPrice(property.price)}
													</div>
													<div className='text-sm text-gray-500'>
														{property.listing_type.replace('_', ' ')}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
															property.status
														)}`}
													>
														{property.status}
													</span>
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
													<div className='flex items-center'>
														<Eye className='h-4 w-4 text-gray-400 mr-1' />
														{property.views}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
													<div className='flex space-x-2'>
														<button
															onClick={() =>
																router.push(
																	`/admin/properties/${property.id}/edit`
																)
															}
															className='text-indigo-600 hover:text-indigo-900'
														>
															<Edit className='h-5 w-5' />
														</button>
														<button
															onClick={() => {
																if (
																	confirm(
																		'Are you sure you want to delete this property?'
																	)
																) {
																	// Handle delete
																}
															}}
															className='text-red-600 hover:text-red-900'
														>
															<Trash2 className='h-5 w-5' />
														</button>
													</div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</AdminLayout>
	)
}
