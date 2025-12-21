'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import Image from 'next/image'
import PropertyViewPopup from '@/components/PropertyViewPopup' 
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
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { ToastContainer } from '@/components/Toast'

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
import { PropertyFilter } from '@/types/property'

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
	price_min: number
	price_max: number
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
	state_id: number
	city_id: number
	district_id: number
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
	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean
		propertyId: number | null
		propertyTitle: string
	}>({ open: false, propertyId: null, propertyTitle: '' })
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage] = useState(12)
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
	const [filters, setFilters] = useState<PropertyFilter>({})


	const { toasts, removeToast, showSuccess, showError, showWarning } =
		useToast()

	const [statesOptions, setStatesOptions] = useState<
		{ value: string; label: string }[]
	>([])
	const [citiesOptions, setCitiesOptions] = useState<
		{ value: string; label: string }[]
	>([])
	const [districtsOptions, setDistrictsOptions] = useState<
		{ value: string; label: string }[]
	>([])

	async function fetchStates(): Promise<{ id: number; name: string }[]> {
		const res = await fetch('/api/properties/states')
		if (!res.ok) throw new Error('Failed to fetch states')
		const data = await res.json()
		return data as { id: number; name: string }[]
	}

	async function fetchCitiesByState(stateId: number): Promise<{ id: number; name: string }[]> {
		const res = await fetch(`/api/properties/cities/${stateId}`)
		if (!res.ok) throw new Error('Failed to fetch cities')
		const data = await res.json()
		return data as { id: number; name: string }[]
	}

	async function fetchDistrictsByState(stateId: number): Promise<{ id: number; name: string }[]> {
		const res = await fetch(`/api/properties/districts/${stateId}`)
		if (!res.ok) throw new Error('Failed to fetch districts')
		const data = await res.json()
		return data as { id: number; name: string }[]
	}


	useEffect(() => {
		async function loadStates() {
			const states = await fetchStates()
			setStatesOptions(
				states.map(s => ({
					value: String(s.id),
					label: s.name,
				}))
			)
		}
		loadStates()
	}, [])

	useEffect(() => {
		if (!filters.state_id) {
			setCitiesOptions([])
			setDistrictsOptions([])
			return
		}

		async function loadCitiesAndDistricts() {
			const [cities, districts] = await Promise.all([
				fetchCitiesByState(filters.state_id as number),
				fetchDistrictsByState(filters.state_id as number),
			])

			setCitiesOptions(
				cities.map(c => ({
					value: String(c.id),
					label: c.name,
				}))
			)

			setDistrictsOptions(
				districts.map(d => ({
					value: String(d.id),
					label: d.name,
				}))
			)
		}

		loadCitiesAndDistricts()
	}, [filters.state_id])


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

	const handleRequestDelete = (id: number, title: string) => {
		setConfirmDialog({ open: true, propertyId: id, propertyTitle: title })
	}

	const handleConfirmDelete = async () => {
		if (!confirmDialog.propertyId) return
		const propertyId = confirmDialog.propertyId
		const propertyTitle = confirmDialog.propertyTitle

		setDeletingId(propertyId)

		try {
			const response = await fetch(`/api/admin/properties/${propertyId}`, {
				method: 'DELETE',
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to delete property')
			}

			setProperties(prev => prev.filter(p => p.id !== propertyId))
			showSuccess(`"${propertyTitle}" հայտարարությունը ջնջվեց։`)
		} catch (error) {
			console.error('Error deleting property:', error)
			showError('Չհաջողվեց ջնջել հայտարարությունը։ Խնդրում ենք կրկին փորձել։')
		} finally {
			setDeletingId(null)
			setShowMobileActions(null)
			setConfirmDialog({ open: false, propertyId: null, propertyTitle: '' })
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
			filters.property_type === undefined ||
			property.property_type === filters.property_type

		const matchesListingType =
			filters.listing_type === undefined ||
			property.listing_type === filters.listing_type

		const matchesStatus =
			filters.status === undefined ||
			property.status_name?.toLowerCase() === filters.status.toLowerCase()


			const matchesVisibility =
				filters.is_hidden === undefined ||
				property.is_hidden === filters.is_hidden

			const matchesExclusive =
				filters.is_exclusive === undefined ||
				(property.is_exclusive) === filters.is_exclusive

			const priceMin = Number(filters.min_price) || 0
			const priceMax = Number(filters.max_price) || Infinity
			const matchesPrice =
				(filters.min_price === undefined ||
					property.price >= filters.min_price) &&
				(filters.max_price === undefined || property.price <= filters.max_price)


			// Фильтры по локации
			const matchesState =
				!filters.state_id || property.state_id === Number(filters.state_id)
			const matchesCity =
				!filters.city_id || property.city_id === Number(filters.city_id)
			const matchesDistrict =
				!filters.district_id ||
				property.district_id === Number(filters.district_id)
			
			return (
				matchesPropertyType &&
				matchesListingType &&
				matchesStatus &&
				matchesVisibility &&
				matchesExclusive &&
				matchesPrice &&
				matchesState &&
				matchesCity &&
				matchesDistrict
			)
	})

	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentProperties = filteredProperties.slice(
		indexOfFirstItem,
		indexOfLastItem
	)
	const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)

	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm, filters])

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
			<ToastContainer toasts={toasts} onRemove={removeToast} />
			<AlertDialog
				open={confirmDialog.open}
				onOpenChange={open => setConfirmDialog({ ...confirmDialog, open })}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Հաստատե՞լ ջնջումը</AlertDialogTitle>
						<AlertDialogDescription>
							Համոզվա՞ծ եք, որ ցանկանում եք ջնջել «{confirmDialog.propertyTitle}
							» հայտարարությունը։
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
							<div className='border-t pt-4 space-y-4'>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Գույքի տեսակ
										</label>
										<select
											value={filters.property_type || ''}
											onChange={e =>
												setFilters({
													...filters,
													property_type: (e.target.value as any) || undefined,
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
											value={filters.listing_type || ''}
											onChange={e =>
												setFilters({
													...filters,
													listing_type: (e.target.value as any) || undefined,
												})
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
											value={
												filters.is_hidden === undefined
													? ''
													: String(filters.is_hidden)
											}
											onChange={e => {
												const value = e.target.value
												setFilters({
													...filters,
													is_hidden:
														value === '' ? undefined : value === 'true',
												})
											}}
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
											value={
												filters.is_exclusive === undefined
													? ''
													: String(filters.is_exclusive)
											}
											onChange={e => {
												const value = e.target.value
												setFilters({
													...filters,
													is_exclusive:
														value === '' ? undefined : value === 'true',
												})
											}}
											className='w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											{exclusiveOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Գին
										</label>
										<div className='flex gap-2'>
											<input
												type='number'
												placeholder='Մին'
												value={filters.min_price || ''}
												onChange={e =>
													setFilters({
														...filters,
														min_price: e.target.value
															? Number(e.target.value)
															: undefined,
													})
												}
												className='w-1/2 border h-9 border-gray-300 text-black rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
											/>
											<input
												type='number'
												placeholder='Մաքս'
												value={filters.max_price || ''}
												onChange={e =>
													setFilters({
														...filters,
														max_price: e.target.value
															? Number(e.target.value)
															: undefined,
													})
												}
												className='w-1/2 h-9 border border-gray-300 text-black rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
											/>
										</div>
									</div>
								</div>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
									{/* Region / State */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Մարզ
										</label>
										<select
											value={filters.state_id ? String(filters.state_id) : ''}
											onChange={e =>
												setFilters({
													...filters,
													state_id: e.target.value
														? Number(e.target.value)
														: undefined,
												})
											}
											className='w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											<option value=''>Բոլորը</option>
											{statesOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>

									{/* City */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Քաղաք
										</label>
										<select
											value={filters.city_id ? String(filters.city_id) : ''}
											onChange={e =>
												setFilters({
													...filters,
													city_id: e.target.value
														? Number(e.target.value)
														: undefined,
												})
											}
											className='w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											<option value=''>Բոլորը</option>
											{citiesOptions.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>

									{/* District */}
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Շրջան
										</label>
										<select
											value={
												filters.district_id ? String(filters.district_id) : ''
											}
											onChange={e =>
												setFilters({
													...filters,
													district_id: e.target.value
														? Number(e.target.value)
														: undefined,
												})
											}
											className='w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
										>
											<option value=''>Բոլորը</option>
											{districtsOptions.map(option => (
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
												property_type: undefined,
												listing_type: undefined,
												status: undefined,
												is_hidden: undefined,
												is_exclusive: undefined,
												min_price: undefined,
												max_price: undefined,
												state_id: undefined,
												city_id: undefined,
												district_id: undefined,
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
							currentProperties.map(property => {
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
																handleRequestDelete(property.id, property.title)
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
									currentProperties.map(property => {
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
												<td className='px-6 py-4 whitespace-nowrap cursor-pointer'>
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
															onClick={e => e.stopPropagation()}
															className='text-indigo-600 hover:text-indigo-900 disabled:opacity-50'
															title='Edit property'
														>
															<Edit className='h-5 w-5' />
														</Link>
														<button
															onClick={e => {
																e.stopPropagation()
																handleRequestDelete(property.id, property.title)
															}}
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
			{filteredProperties.length > 0 && (
				<div className='flex items-center mt-2 justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg shadow'>
					{/* Mobile Pagination */}
					<div className='flex justify-between flex-1 sm:hidden'>
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className='relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Նախորդ
						</button>
						<div className='flex items-center'>
							<span className='text-sm text-gray-700'>
								Էջ <span className='font-medium'>{currentPage}</span> /{' '}
								<span className='font-medium'>{totalPages}</span>
							</span>
						</div>
						<button
							onClick={() =>
								setCurrentPage(prev => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className='relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Հաջորդ
						</button>
					</div>

					{/* Desktop Pagination */}
					<div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
						<div>
							<p className='text-sm text-gray-700'>
								Ցուցադրվում է{' '}
								<span className='font-medium'>{indexOfFirstItem + 1}</span> -{' '}
								<span className='font-medium'>
									{Math.min(indexOfLastItem, filteredProperties.length)}
								</span>{' '}
								ընդհանուր{' '}
								<span className='font-medium'>{filteredProperties.length}</span>
								-ից
							</p>
						</div>
						<div>
							<nav
								className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
								aria-label='Pagination'
							>
								{/* Previous Button */}
								<button
									onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className='relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
								>
									<span className='sr-only'>Նախորդ</span>
									<svg
										className='h-5 w-5'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 0 20 20'
										fill='currentColor'
									>
										<path
											fillRule='evenodd'
											d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
											clipRule='evenodd'
										/>
									</svg>
								</button>

								{/* Page Numbers */}
								{(() => {
									const pages = []
									const maxVisiblePages = 7

									if (totalPages <= maxVisiblePages) {
										// Show all pages if total is less than max
										for (let i = 1; i <= totalPages; i++) {
											pages.push(i)
										}
									} else {
										// Always show first page
										pages.push(1)

										if (currentPage > 3) {
											pages.push('...')
										}

										// Show pages around current page
										const start = Math.max(2, currentPage - 1)
										const end = Math.min(totalPages - 1, currentPage + 1)

										for (let i = start; i <= end; i++) {
											pages.push(i)
										}

										if (currentPage < totalPages - 2) {
											pages.push('...')
										}

										// Always show last page
										pages.push(totalPages)
									}

									return pages.map((page, idx) => {
										if (page === '...') {
											return (
												<span
													key={`ellipsis-${idx}`}
													className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700'
												>
													...
												</span>
											)
										}

										return (
											<button
												key={page}
												onClick={() => setCurrentPage(page as number)}
												className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
													currentPage === page
														? 'z-10 bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
														: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
												}`}
											>
												{page}
											</button>
										)
									})
								})()}

								{/* Next Button */}
								<button
									onClick={() =>
										setCurrentPage(prev => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className='relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
								>
									<span className='sr-only'>Հաջորդ</span>
									<svg
										className='h-5 w-5'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 0 20 20'
										fill='currentColor'
									>
										<path
											fillRule='evenodd'
											d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
											clipRule='evenodd'
										/>
									</svg>
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}
		</AdminLayout>
	)
}
