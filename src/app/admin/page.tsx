// src/app/admin/page.tsx - Simple dashboard page
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import Image from 'next/image'
import {
	Home,
	Building2,
	Landmark,
	Trees,
	Plus,
	TrendingUp,
	Eye,
	Users,
	Search,
	Filter,
	User,
	Phone,
	Trash2,
	Edit,
	EyeIcon,
} from 'lucide-react'

import { useRouter } from 'next/navigation'

interface DashboardStats {
	totalProperties: number
	availableProperties: number
	soldRentedProperties: number
	featuredProperties: number
	totalViews: number
	recentProperties: Array<{
		id: number
		title: string
		property_type: string
		created_at: string
		views: number
	}>
}

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
	owner_name?: string
	owner_phone?: string
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		totalProperties: 0,
		availableProperties: 0,
		soldRentedProperties: 0,
		featuredProperties: 0,
		totalViews: 0,
		recentProperties: [],
	})
	const [loading, setLoading] = useState(true)
	const router = useRouter()
		const [properties, setProperties] = useState<PropertyListItem[]>([])
		const [searchTerm, setSearchTerm] = useState('')
		const [showFilters, setShowFilters] = useState(false)
		const [showOwnerDetails, setShowOwnerDetails] = useState(false)
		const [deletingId, setDeletingId] = useState<number | null>(null)
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

		const handleDeleteProperty = async (
			propertyId: number,
			propertyTitle: string
		) => {
			if (
				!confirm(
					`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`
				)
			) {
				return
			}

			setDeletingId(propertyId)

			try {
				const response = await fetch(`/api/admin/properties/${propertyId}`, {
					method: 'DELETE',
				})

				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to delete property')
				}

				// Remove the property from the local state
				setProperties(prev =>
					prev.filter(property => property.id !== propertyId)
				)

				// Show success message (optional)
				alert('Property deleted successfully')
			} catch (error) {
				console.error('Error deleting property:', error)
				alert(
					error instanceof Error
						? error.message
						: 'Failed to delete property. Please try again.'
				)
			} finally {
				setDeletingId(null)
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

				// Check owner name and phone if available
				let ownerMatches = false
				if (property.owner_name || property.owner_phone) {
					ownerMatches = !!(
						property.owner_name?.toLowerCase().includes(search) ||
						property.owner_phone?.toLowerCase().includes(search)
					)
				}

				// If none of the fields match the search term, exclude this property
				if (
					!customIdMatches &&
					!ownerMatches &&
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

			return matchesPropertyType && matchesListingType && matchesStatus
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
			{ value: '', label: 'Բոլորը' },
			{ value: 'house', label: 'Առանձնատուն' },
			{ value: 'apartment', label: 'Բնակարան' },
			{ value: 'commercial', label: 'Կոմերցիոն' },
			{ value: 'land', label: 'Հողատարածք' },
		]

		const listingTypeOptions = [
			{ value: '', label: 'Բոլորը' },
			{ value: 'sale', label: 'Վաճառքի' },
			{ value: 'rent', label: 'Վարձակալության' },
			{ value: 'daily_rent', label: 'Օրյա վարձակալություն' },
		]

		const statusOptions = [
			{ value: '', label: 'Բոլորը' },
			{ value: 'available', label: 'Հասանելի է' },
			{ value: 'sold', label: 'Վաճառված' },
			{ value: 'rented', label: 'Վարձակալված' },
			{ value: 'pending', label: 'Սպասում է' },
		]

	useEffect(() => {
		fetchDashboardStats()
	}, [])

	const fetchDashboardStats = async () => {
		try {
			const response = await fetch('/api/admin/properties')
			if (!response.ok) {
				throw new Error('Failed to fetch properties')
			}
			const properties = await response.json()

			// Calculate stats
			const totalProperties = properties.length
			const availableProperties = properties.filter(
				(p: any) => p.status === 'available'
			).length
			const soldRentedProperties = properties.filter(
				(p: any) => p.status === 'sold' || p.status === 'rented'
			).length
			const featuredProperties = properties.filter(
				(p: any) => p.featured
			).length
			const totalViews = properties.reduce(
				(sum: number, p: any) => sum + (p.views || 0),
				0
			)
			const recentProperties = properties
				.sort(
					(a: any, b: any) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				)
				.slice(0, 5)

			setStats({
				totalProperties,
				availableProperties,
				soldRentedProperties,
				featuredProperties,
				totalViews,
				recentProperties,
			})
		} catch (error) {
			console.error('Error fetching dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
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
				{/* Header */}
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>Գլխավոր</h1>
						<p className='text-gray-500'>
							Ձեր հայտարարությունների կառավարման ամփոփում
						</p>
					</div>
					<Link
						href='/admin/properties/add'
						className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
					>
						<Plus className='w-5 h-5 mr-2' />
						Ավելացնել
					</Link>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-blue-100'>
								<Home className='w-6 h-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>
									Ընդհանուր հայտարարություններ{' '}
								</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.totalProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-green-100'>
								<TrendingUp className='w-6 h-6 text-green-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>Հասանելի է</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.availableProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-red-100'>
								<Users className='w-6 h-6 text-red-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>
									Վաճառված/Վարձակալված
								</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.soldRentedProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-yellow-100'>
								<Eye className='w-6 h-6 text-yellow-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>
									Ընդհանուր դիտումներ
								</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.totalViews}
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className='bg-white rounded-lg shadow p-4'>
					<div className='flex flex-col md:flex-row gap-4'>
						<div className='relative flex-grow'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
							<input
								type='text'
								placeholder='Որոնել ըստ անվանման, գտնվելու վայրի, ID կամ սեփականատիրոջ...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
						>
							<Filter className='w-5 h-5 mr-2' />
							ֆիլտրներ
						</button>
					</div>

					{/* Expanded Filters */}
					{showFilters && (
						<div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									Հայտարուրության տեսակ
								</label>
								<select
									value={filters.property_type}
									onChange={e =>
										setFilters({ ...filters, property_type: e.target.value })
									}
									className='w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
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
									Հայտարարության տեսակ
								</label>
								<select
									value={filters.listing_type}
									onChange={e =>
										setFilters({ ...filters, listing_type: e.target.value })
									}
									className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
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
									Կարգավիճակ
								</label>
								<select
									value={filters.status}
									onChange={e =>
										setFilters({ ...filters, status: e.target.value })
									}
									className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
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
									Մաքրել
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
										Հայտարարություն
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										ID
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Տեսակ
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider '>
										Սեփականատիրոջ մանրամասները
									</th>

									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										վայրը
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Գինը
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Կարգավիճակ
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Դիտումներ
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Գործողություններ
									</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200'>
								{loading ? (
									<tr>
										<td
											colSpan={showOwnerDetails ? 9 : 8}
											className='px-6 py-4 text-center'
										>
											<div className='flex justify-center'>
												<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
											</div>
										</td>
									</tr>
								) : filteredProperties.length === 0 ? (
									<tr>
										<td
											colSpan={showOwnerDetails ? 9 : 8}
											className='px-6 py-4 text-center text-gray-500'
										>
											Հայտարարություններ չեն գտնվել
										</td>
									</tr>
								) : (
									filteredProperties.map(property => {
										const Icon =
											propertyTypeIcons[
												property.property_type as keyof typeof propertyTypeIcons
											] || Home
										const isDeleting = deletingId === property.id

										return (
											<tr
												key={property.id}
												className={`hover:bg-gray-50 ${
													isDeleting ? 'opacity-50' : ''
												}`}
											>
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
														<div className='flex items-center mb-1'>
															<User className='h-3 w-3 text-gray-400 mr-1' />
															<span className='font-medium'>
																{property.owner_name || 'Տեղեկություն չկա'}
															</span>
														</div>
														<div className='flex items-center'>
															<Phone className='h-3 w-3 text-gray-400 mr-1' />
															<span className='text-gray-600'>
																{property.owner_phone || 'Տեղեկություն չկա'}
															</span>
														</div>
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
															onClick={() => router.push(``)}
															disabled={isDeleting}
															className='text-indigo-600 hover:text-indigo-900 disabled:opacity-50'
															title='Edit property'
														>
															<EyeIcon className='h-5 w-5' />
														</button>
														<button
															onClick={() =>
																router.push(
																	`/admin/properties/edit/${property.id}`
																)
															}
															disabled={isDeleting}
															className='text-indigo-600 hover:text-indigo-900 disabled:opacity-50'
															title='Edit property'
														>
															<Edit className='h-5 w-5' />
														</button>
														<button
															onClick={() =>
																handleDeleteProperty(
																	property.id,
																	property.title
																)
															}
															disabled={isDeleting}
															className='text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center'
															title='Delete property'
														>
															{isDeleting ? (
																<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-red-600'></div>
															) : (
																<Trash2 className='h-5 w-5' />
															)}
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
