// src/app/admin/page.tsx - Updated with popup and Armenian translations
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import Image from 'next/image'
import PropertyViewPopup from '@/components/PropertyViewPopup' // Import the popup component
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
	MoreVertical,
	X,
	ChevronDown,
	Crown,
	EyeOff,
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
	status_name: string
	status_display?: string
	status_armenian?: string
	featured: boolean
	views: number
	created_at: string
	user_email: string
	state_name: string
	city_name: string
	primary_image?: string
	owner_name?: string
	owner_phone?: string
	address?: string
	description?: string
	currency?: string
	updated_at: string
	location_display?: string
	district_name?: string
	has_viber: boolean
	has_whatsapp: boolean
	has_telegram: boolean
	is_hidden: boolean 
	is_exclusive: boolean
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
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [selectedProperty, setSelectedProperty] =
		useState<PropertyListItem | null>(null)
	const [showMobileActions, setShowMobileActions] = useState<number | null>(
		null
	)
	const [showPropertyPopup, setShowPropertyPopup] = useState(false)
	const [filters, setFilters] = useState({
		property_type: '',
		listing_type: '',
		status: '',
		is_hidden: '', 
		is_exclusive: '',
	})

	const visibilityOptions = [
		{ value: '', label: 'Բոլորը' },
		{ value: 'false', label: 'Հանրային' },
		{ value: 'true', label: 'Թաքնված' },
	]

	const exclusiveOptions = [
		{ value: '', label: 'Բոլորը' },
		{ value: 'false', label: 'Սովորական' },
		{ value: 'true', label: 'Էքսկլյուզիվ' },
	]

	// Armenian translations for listing types
	const listingTypeDisplay: Record<string, string> = {
		sale: 'Վաճառք',
		rent: 'Վարձակալություն',
		daily_rent: 'Օրյա վարձակալություն',
	}

	// Armenian translations for status names - add these mappings
	const statusNameDisplay: Record<string, string> = {
		available: 'Հասանելի է',
		sold: 'Վաճառված',
		rented: 'Վարձակալված',
		pending: 'Սպասում է',
		under_review: 'Գնահատվում է',
		coming_soon: 'Շուտով',
	}

	useEffect(() => {
		fetchProperties()
		fetchDashboardStats()
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

	const fetchDashboardStats = async () => {
		try {
			console.log('📊 Calculating dashboard stats...')
			const response = await fetch('/api/admin/properties')
			if (!response.ok) {
				throw new Error('Failed to fetch properties')
			}
			const properties = await response.json()

			const totalProperties = properties.length
			const availableProperties = properties.filter((p: any) => {
				const statusName =
					p.status_name?.toLowerCase() || p.status?.toLowerCase()
				console.log('Status check for available:', statusName)
				return statusName === 'available'
			}).length
			const soldRentedProperties = properties.filter((p: any) => {
				const statusName =
					p.status_name?.toLowerCase() || p.status?.toLowerCase()
				console.log('Status check for sold/rented:', statusName)
				return statusName === 'sold' || statusName === 'rented'
			}).length
			const featuredProperties = properties.filter(
				(p: any) => p.featured === true
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

			setProperties(prev => prev.filter(property => property.id !== propertyId))
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
			setShowMobileActions(null)
		}
	}

	// Handle view property click
	const handleViewProperty = (property: PropertyListItem) => {
		setSelectedProperty(property)
		setShowPropertyPopup(true)
		setShowMobileActions(null)
	}

	const filteredProperties = properties.filter(property => {
		const search = searchTerm.toLowerCase().trim()

		if (search === '') {
			// Return all properties if search is empty
		} else {
			let customIdMatches = false

			if (property.custom_id !== undefined && property.custom_id !== null) {
				const customIdString = String(property.custom_id).toLowerCase()
				customIdMatches =
					customIdString === search || customIdString.includes(search)
			}

			let ownerMatches = false
			if (property.owner_name || property.owner_phone) {
				ownerMatches = !!(
					property.owner_name?.toLowerCase().includes(search) ||
					property.owner_phone?.toLowerCase().includes(search)
				)
			}

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

		const matchesPropertyType =
			filters.property_type === '' ||
			property.property_type === filters.property_type

		const matchesListingType =
			filters.listing_type === '' ||
			property.listing_type === filters.listing_type

		const matchesStatus =
			filters.status === '' || property.status_name === filters.status

			const matchesVisibility =
				filters.is_hidden === '' ||
				String(property.is_hidden) === filters.is_hidden

			const matchesExclusive =
				filters.is_exclusive === '' ||
				String(property.is_exclusive) === filters.is_exclusive

			return (
				matchesPropertyType &&
				matchesListingType &&
				matchesStatus &&
				matchesVisibility &&
				matchesExclusive
			)

		return matchesPropertyType && matchesListingType && matchesStatus
	})

	const propertyTypeIcons = {
		house: Home,
		apartment: Building2,
		commercial: Landmark,
		land: Trees,
	}

	const propertyTypeDisplay: Record<string, string> = {
		house: 'Տուն',
		apartment: 'Բնակարան',
		commercial: 'Կոմերցիոն',
		land: 'Հողատարածք',
	}

	const formatPrice = (price: number, currency: string = 'USD') => {
		if (currency === 'AMD') {
			// Format the number with no decimals and add the Armenian Dram symbol
			const formatted = new Intl.NumberFormat('hy-AM', {
				maximumFractionDigits: 0,
			}).format(price)
			return `${formatted} ֏` // Armenian Dram symbol
		}

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price)
	}

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'available':
			case 'հասանելի է':
				return 'bg-green-100 text-green-800'
			case 'sold':
			case 'վաճառված':
				return 'bg-red-100 text-red-800'
			case 'rented':
			case 'վարձակալված':
				return 'bg-blue-100 text-blue-800'
			case 'pending':
			case 'սպասում է':
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const getLocationDisplay = (property: PropertyListItem) => {
		// Use the pre-calculated location_display from the API if available
		if (property.location_display) {
			return property.location_display
		}

		// Fallback logic if location_display is not available
		const parts = []

		// Add district if available (for Yerevan)
		if (property.district_name) {
			parts.push(property.district_name)
		}

		// Add city (will be "Երևան" for districts or actual city name for others)
		if (property.city_name) {
			parts.push(property.city_name)
		}

		// Add state
		if (property.state_name) {
			parts.push(property.state_name)
		}

		return parts.length > 0 ? parts.join(', ') : 'Տեղեկություն չկա'
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
			<div className='space-y-4 sm:space-y-6'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
					<div>
						<h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
							Գլխավոր
						</h1>
					</div>
					<Link
						href='/admin/properties/add'
						className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center'
					>
						<Plus className='w-5 h-5 mr-2' />
						Ավելացնել
					</Link>
				</div>

				{/* Stats Grid */}
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
					<div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-2 sm:p-3 rounded-full bg-blue-100'>
								<Home className='w-4 h-4 sm:w-6 sm:h-6 text-blue-600' />
							</div>
							<div className='ml-3 sm:ml-4'>
								<p className='text-xs sm:text-sm font-medium text-gray-500'>
									Ընդհանուր հայտարարություններ
								</p>
								<p className='text-lg sm:text-2xl font-bold text-gray-900'>
									{stats.totalProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-2 sm:p-3 rounded-full bg-green-100'>
								<TrendingUp className='w-4 h-4 sm:w-6 sm:h-6 text-green-600' />
							</div>
							<div className='ml-3 sm:ml-4'>
								<p className='text-xs sm:text-sm font-medium text-gray-500'>
									Հասանելի է
								</p>
								<p className='text-lg sm:text-2xl font-bold text-gray-900'>
									{stats.availableProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-2 sm:p-3 rounded-full bg-red-100'>
								<Users className='w-4 h-4 sm:w-6 sm:h-6 text-red-600' />
							</div>
							<div className='ml-3 sm:ml-4'>
								<p className='text-xs sm:text-sm font-medium text-gray-500'>
									Վաճառված/Վարձակալված
								</p>
								<p className='text-lg sm:text-2xl font-bold text-gray-900'>
									{stats.soldRentedProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-2 sm:p-3 rounded-full bg-yellow-100'>
								<Eye className='w-4 h-4 sm:w-6 sm:h-6 text-yellow-600' />
							</div>
							<div className='ml-3 sm:ml-4'>
								<p className='text-xs sm:text-sm font-medium text-gray-500'>
									Ընդհանուր դիտումներ
								</p>
								<p className='text-lg sm:text-2xl font-bold text-gray-900'>
									{stats.totalViews}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Search and Filter Bar */}
				<div className='bg-white rounded-lg shadow p-4'>
					<div className='flex flex-col space-y-4'>
						<div className='flex flex-col sm:flex-row gap-4'>
							<div className='relative flex-grow'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
								<input
									type='text'
									placeholder='Որոնել ըստ անվանման, գտնվելու վայրի, ID կամ սեփականատիրոջ...'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className='w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base'
								/>
							</div>
							<div className='flex gap-2'>
								<button
									onClick={() => setShowFilters(!showFilters)}
									className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm'
								>
									<Filter className='w-4 h-4 mr-2' />
									ֆիլտրներ
									<ChevronDown
										className={`w-4 h-4 ml-1 transition-transform ${
											showFilters ? 'rotate-180' : ''
										}`}
									/>
								</button>
							</div>
						</div>

						{/* Expanded Filters */}
						{showFilters && (
							<div className='border-t pt-4'>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Գույքի տեսակ
										</label>
										<select
											value={filters.property_type}
											onChange={e =>
												setFilters({
													...filters,
													property_type: e.target.value,
												})
											}
											className='w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
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
											className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
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
											className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											{statusOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Տեսանելիություն
										</label>
										<select
											value={filters.is_hidden}
											onChange={e =>
												setFilters({ ...filters, is_hidden: e.target.value })
											}
											className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											{visibilityOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Էքսկլյուզիվություն
										</label>
										<select
											value={filters.is_exclusive}
											onChange={e =>
												setFilters({ ...filters, is_exclusive: e.target.value })
											}
											className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											{exclusiveOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
								</div>
								<div className='mt-4'>
									<button
										onClick={() => {
											setFilters({
												property_type: '',
												listing_type: '',
												status: '',
												is_hidden: '',
												is_exclusive: '',
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
				</div>

				{/* Mobile Cards View */}
				<div className='block lg:hidden'>
					<div className='space-y-4'>
						{loading ? (
							<div className='text-center py-8'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
							</div>
						) : filteredProperties.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								Հայտարարություններ չեն գտնվել
							</div>
						) : (
							filteredProperties.map(property => {
								const Icon =
									propertyTypeIcons[
										property.property_type as keyof typeof propertyTypeIcons
									] || Home
								const isDeleting = deletingId === property.id

								return (
									<div
										key={property.id}
										className={`bg-white rounded-lg shadow p-4 ${
											isDeleting ? 'opacity-50' : ''
										}`}
									>
										<div className='flex items-start justify-between mb-3'>
											<div className='flex items-center flex-grow'>
												<div className='h-12 w-12 flex-shrink-0'>
													{property.primary_image ? (
														<Image
															src={property.primary_image}
															alt={property.title}
															width={48}
															height={48}
															className='h-12 w-12 rounded-lg object-cover'
														/>
													) : (
														<div className='h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center'>
															<Icon className='h-6 w-6 text-gray-500' />
														</div>
													)}
												</div>
												<div className='ml-3 flex-grow'>
													<div className='text-sm font-medium text-gray-900 line-clamp-1'>
														{property.title.length > 12
															? `${property.title.substring(0, 12)}...`
															: property.title}
													</div>
													<div className='text-xs text-gray-500'>
														ID:{' '}
														{property.custom_id !== undefined &&
														property.custom_id !== null
															? String(property.custom_id)
															: '-'}
													</div>
													<div className='text-xs text-gray-500'>
														{property.city_name}, {property.state_name}
													</div>
												</div>
											</div>
											<div className='relative'>
												<button
													onClick={() =>
														setShowMobileActions(
															showMobileActions === property.id
																? null
																: property.id
														)
													}
													className='p-2 hover:bg-gray-100 rounded-lg'
												>
													<MoreVertical className='w-4 h-4 text-gray-900' />
												</button>
												{showMobileActions === property.id && (
													<div className='absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border z-10'>
														<button
															onClick={() => handleViewProperty(property)}
															className='w-full text-gray-700 text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm'
														>
															<EyeIcon className='w-4 h-4 mr-2' />
															Դիտել
														</button>
														<button
															onClick={() => {
																router.push(
																	`/admin/properties/edit/${property.id}`
																)
																setShowMobileActions(null)
															}}
															className='w-full text-gray-700 text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm'
														>
															<Edit className='w-4 h-4 mr-2' />
															Փոփոխել
														</button>
														<button
															onClick={() =>
																handleDeleteProperty(
																	property.id,
																	property.title
																)
															}
															className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm text-red-600'
														>
															<Trash2 className='w-4 h-4 mr-2' />
															Ջնջել
														</button>
													</div>
												)}
											</div>
										</div>

										<div className='grid grid-cols-2 gap-4 text-xs'>
											<div>
												<span className='text-gray-500'>Տեսակ:</span>
												<div className='flex items-center mt-1'>
													<Icon className='h-3 w-3 text-gray-400 mr-1' />
													<span className='text-gray-900'>
														{propertyTypeDisplay[property.property_type] ||
															property.property_type}
													</span>
												</div>
											</div>
											<div>
												<span className='text-gray-500'>Գինը:</span>
												<div className='text-gray-900 font-medium mt-1'>
													{formatPrice(property.price, property.currency)}
												</div>
											</div>
											<div>
												<span className='text-gray-500'>Կարգավիճակ:</span>
												<div className='mt-1'>
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
															property.status_name || ''
														)}`}
													>
														{statusNameDisplay[property.status_name] ||
															property.status_name ||
															'Չի նշված'}
													</span>
												</div>
											</div>
											<div>
												<span className='text-gray-500'>Դիտումներ:</span>
												<div className='flex items-center mt-1'>
													<Eye className='h-3 w-3 text-gray-400 mr-1' />
													<span className='text-gray-900'>
														{property.views}
													</span>
												</div>
											</div>
										</div>

										{/* Owner Details - Always Visible */}
										{(property.owner_name || property.owner_phone) && (
											<div className='mt-3 pt-3 border-t border-gray-200 bg-gray-50 -mx-4 px-4 -mb-4 pb-4 rounded-b-lg'>
												<div className='text-xs text-gray-800'>
													<div className='font-medium mb-1'>
														Սեփականատիրոջ տվյալներ:
													</div>
													<div className='mb-1'>
														<span className='font-medium'>Անուն:</span>{' '}
														{property.owner_name || 'Տեղեկություն չկա'}
													</div>
													<div>
														<span className='font-medium'>Հեռախոս:</span>{' '}
														{property.owner_phone || 'Տեղեկություն չկա'}
													</div>
												</div>
											</div>
										)}
										{(property.has_viber ||
											property.has_whatsapp ||
											property.has_telegram) && (
											<div className='mt-3 pt-3 border-t border-gray-200'>
												<div className='text-xs text-gray-800'>
													<div className='font-medium mb-1'>
														Կապի եղանակներ:
													</div>
													<div className='flex gap-1'>
														{property.has_viber && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
																Viber
															</span>
														)}
														{property.has_whatsapp && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
																WhatsApp
															</span>
														)}
														{property.has_telegram && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
																Telegram
															</span>
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								)
							})
						)}
					</div>
				</div>

				{/* Desktop Table View */}
				<div className='hidden lg:block bg-white rounded-lg shadow overflow-hidden'>
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
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Սեփականատիրոջ մանրամասները
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Կապի եղանակներ
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Տեսանելիություն
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
										<td colSpan={9} className='px-6 py-4 text-center'>
											<div className='flex justify-center'>
												<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
											</div>
										</td>
									</tr>
								) : filteredProperties.length === 0 ? (
									<tr>
										<td
											colSpan={9}
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
												className={`hover:bg-gray-50 cursor-pointer ${
													isDeleting ? 'opacity-50' : ''
												}`}
												onClick={() => handleViewProperty(property)}
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
																{property.title.length > 15
																	? `${property.title.substring(0, 15)}...`
																	: property.title}
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
															{propertyTypeDisplay[property.property_type] ||
																property.property_type}
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
													<div className='flex space-x-1'>
														{property.has_viber && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
																V
															</span>
														)}
														{property.has_whatsapp && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
																W
															</span>
														)}
														{property.has_telegram && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
																T
															</span>
														)}
														{!property.has_viber &&
															!property.has_whatsapp &&
															!property.has_telegram && (
																<span className='text-gray-400 text-xs'>
																	Չի նշված
																</span>
															)}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='flex flex-col space-y-1'>
														{property.is_hidden && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
																<EyeOff className='w-3 h-3 mr-1' />
																Թաքնված
															</span>
														)}
														{property.is_exclusive && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
																<Crown className='w-3 h-3 mr-1' />
																Էքսկլյուզիվ
															</span>
														)}
														{!property.is_hidden && !property.is_exclusive && (
															<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
																<Eye className='w-3 h-3 mr-1' />
																Հանրային
															</span>
														)}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm text-gray-900'>
														{property.state_name === 'Երևան' ? (
															property.district_name
														) : (
															<>
																{property.city_name}
																{property.district_name &&
																	`, ${property.district_name}`}
															</>
														)}
													</div>
													<div className='text-sm text-gray-500'>
														{property.state_name}
													</div>
												</td>

												<td className='px-6 py-4 whitespace-nowrap'>
													<div className='text-sm text-gray-900'>
														{formatPrice(property.price, property.currency)}
													</div>
													<div className='text-sm text-gray-500'>
														{listingTypeDisplay[property.listing_type] ||
															property.listing_type}
													</div>
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
															property.status_name || ''
														)}`}
													>
														{statusNameDisplay[property.status_name] ||
															property.status_name ||
															'Չի նշված'}
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
														<Link
															href={`/admin/properties/edit/${property.id}`}
															target='_blank'
															rel='noopener noreferrer'
															className='text-indigo-600 hover:text-indigo-900 disabled:opacity-50'
															title='Edit property'
														>
															<Edit className='h-5 w-5' />
														</Link>
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

				{/* Property View Popup */}
				<PropertyViewPopup
					property={selectedProperty}
					isOpen={showPropertyPopup}
					onClose={() => {
						setShowPropertyPopup(false)
						setSelectedProperty(null)
					}}
				/>
			</div>
		</AdminLayout>
	)
}
