// src/app/admin/properties/edit/[id]/page.tsx - FIXED with translated status names
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import MediaEditManager from '@/components/MediaEditManager'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

import {
	PropertyType,
	ListingType,
	PropertyStatus,
	State,
	City,
	PropertyFeature,
} from '@/types/property'

import {
	Building2,
	Home,
	Landmark,
	Trees,
	Save,
	MapPin,
	Image as ImageIcon,
	Loader2,
	User,
	Trash2,
	Star,
	Video,
	Phone,
	Crown,
	EyeOff,
	Eye,
	Boxes,
	AlertCircle,
	Flame,
} from 'lucide-react'
import Image from 'next/image'
import LocationSelector from '@/components/LocationSelector'
import FallbackAddressInput from '@/components/FallbackAddressInput'

interface PropertyEditPageProps {
	params: Promise<{ id: string }>
}

export default function EditPropertyPage({ params }: PropertyEditPageProps) {
	const resolvedParams = use(params)
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [features, setFeatures] = useState<PropertyFeature[]>([])
	const [statuses, setStatuses] = useState<PropertyStatus[]>([])
	const [existingMedia, setExistingMedia] = useState<any[]>([])
	const [mediaFiles, setMediaFiles] = useState<File[]>([])
	const [mediaTypes, setMediaTypes] = useState<string[]>([])
	const [primaryMediaIndex, setPrimaryMediaIndex] = useState(0)
	const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()
	const [apartmentBuildingTypes, setApartmentBuildingTypes] = useState<any[]>([])
	const [commercialBusinessTypes, setCommercialBusinessTypes] = useState<any[]>([])

	// Basic property data
	const [formData, setFormData] = useState({
		custom_id: '',
		title: '',
		description: '',
		property_type: 'house' as PropertyType,
		listing_type: 'sale' as ListingType,
		price: '',
		currency: 'USD',
		state_id: '',
		city_id: '',
		district_id: '',
		address: '',
		selectedFeatures: [] as number[],
		// Owner details (admin only)
		owner_name: '',
		owner_phone: '',
		address_admin: '',
		status: 'available', // Default status
		has_viber: false,
		has_whatsapp: false,
		has_telegram: false,
		is_hidden: false,
		is_exclusive: false,
		is_top: false,
		is_urgently: false,
		url_3d: ''
	})

	// Property type specific attributes
	const [attributes, setAttributes] = useState<{
		bedrooms: string
		bathrooms: string
		area_sqft: string
		year_built: string
		lot_size_sqft: string
		floors: string
		roof_type: string
		floor: string
		total_floors: string
		unit_number: string
		business_type: string
		ceiling_height: string
		area_acres: string
		rooms: string
		building_type_id: string 
		business_type_id: string
	}>({
		bedrooms: '',
		bathrooms: '',
		area_sqft: '',
		year_built: '',
		lot_size_sqft: '',
		floors: '',
		roof_type: '',
		floor: '',
		total_floors: '',
		unit_number: '',
		business_type: '',
		ceiling_height: '',
		area_acres: '',
		rooms: '',
		building_type_id: '',
		business_type_id: '',
	})

	// ✅ FIXED: Armenian translations for status names
	const statusNameDisplay: Record<string, string> = {
		available: 'Հասանելի է',
		sold: 'Վաճառված',
		rented: 'Վարձակալված',
		pending: 'Սպասում է',
		under_review: 'Գնահատվում է',
		coming_soon: 'Շուտով',
		draft: 'Նախագիծ',
		archived: 'Արխիվացված',
	}

	useEffect(() => {
		console.log(
			'🚀 Edit Property: Starting data fetch for property ID:',
			resolvedParams.id
		)

		const propertyId = parseInt(resolvedParams.id)
		if (isNaN(propertyId)) {
			console.error('❌ Invalid property ID:', resolvedParams.id)
			setError('Invalid property ID provided')
			setLoading(false)
			return
		}

		// Fetch all required data
		Promise.all([
			fetch('/api/properties/states').then(res => {
				console.log('📍 States API response status:', res.status)
				return res.json()
			}),
			fetch('/api/properties/features').then(res => {
				console.log('🏷️ Features API response status:', res.status)
				return res.json()
			}),
			fetch('/api/admin/statuses').then(res => {
				console.log('📊 Statuses API response status:', res.status)
				if (!res.ok) {
					console.error(
						'❌ Failed to fetch statuses:',
						res.status,
						res.statusText
					)
					return []
				}
				return res.json()
			}),
			fetch('/api/admin/properties/apartment-building-types').then(res =>
			res.json()
			),
			fetch('/api/admin/properties/commercial-business-types').then(res =>
				res.json()
			),
			fetch(`/api/admin/properties/${resolvedParams.id}`).then(res => {
				console.log('🏠 Property API response status:', res.status)
				if (!res.ok) {
					console.error(
						'❌ Failed to fetch property:',
						res.status,
						res.statusText
					)
					throw new Error(`Failed to fetch property: ${res.status}`)
				}
				return res.json()
			}),
		])
			.then(([statesData, featuresData, statusesData, buildingTypes, businessTypes, propertyData]) => {
				console.log('✅ Edit Property: All data fetched successfully:')
				console.log('📍 States:', statesData?.length || 0, 'items')
				console.log('🏷️ Features:', featuresData?.length || 0, 'items')
				console.log('📊 Statuses:', statusesData?.length || 0, 'items')
				console.log('🏠 Property data:', propertyData?.title)

				setStates(statesData || [])
				setFeatures(featuresData || [])
				setApartmentBuildingTypes(buildingTypes || [])
				setCommercialBusinessTypes(businessTypes || [])
				// ✅ Add safety check for statuses with better error handling
				if (Array.isArray(statusesData) && statusesData.length > 0) {
					console.log('✅ Setting statuses:', statusesData)
					setStatuses(statusesData)
				} else {
					console.error('❌ Statuses data is not a valid array:', statusesData)
					// Set default statuses if API fails
					const fallbackStatuses = [
						{
							id: 1,
							name: 'available',
							display_name: 'Available',
							color: '#green',
							is_active: true,
							sort_order: 1,
						},
						{
							id: 2,
							name: 'sold',
							display_name: 'Sold',
							color: '#red',
							is_active: true,
							sort_order: 2,
						},
						{
							id: 3,
							name: 'rented',
							display_name: 'Rented',
							color: '#blue',
							is_active: true,
							sort_order: 3,
						},
					]
					console.log('🔄 Using fallback statuses')
					setStatuses(fallbackStatuses)
				}

				if (!propertyData || propertyData.error) {
					throw new Error(propertyData?.error || 'Property data is invalid')
				}

				console.log('📝 Raw property data location:', {
					state_id: propertyData.state_id,
					city_id: propertyData.city_id,
					district_id: propertyData.district_id,
				})

				setFormData({
					custom_id: propertyData.custom_id || '',
					title: propertyData.title || '',
					description: propertyData.description || '',
					property_type: propertyData.property_type || 'house',
					listing_type: propertyData.listing_type || 'sale',
					price: propertyData.price?.toString() || '',
					currency: propertyData.currency || 'USD',
					state_id: propertyData.state_id?.toString() || '',
					city_id: propertyData.city_id?.toString() || '',
					district_id: propertyData.district_id?.toString() || '',
					address: propertyData.address || '',
					selectedFeatures: propertyData.features?.map((f: any) => f.id) || [],
					owner_name: propertyData.owner_name || '',
					owner_phone: propertyData.owner_phone || '',
					address_admin: propertyData.address_admin || '',
					status: propertyData.status_name || 'available',
					has_viber: propertyData.has_viber || false,
					has_whatsapp: propertyData.has_whatsapp || false,
					has_telegram: propertyData.has_telegram || false,
					is_hidden: propertyData.is_hidden || false,
					is_exclusive: propertyData.is_exclusive || false,
					is_top: propertyData.is_top || false,
					is_urgently: propertyData.is_urgently || false,
					url_3d: propertyData.url_3d || ''
				})

				console.log('✅ Form data set with location:', {
					state_id: propertyData.state_id?.toString() || '',
					city_id: propertyData.city_id?.toString() || '',
					district_id: propertyData.district_id?.toString() || '',
				})

				// ✅ CRITICAL: Fetch cities immediately after setting state_id
				if (propertyData.state_id) {
					console.log(
						'🏙️ Loading cities for existing state_id:',
						propertyData.state_id
					)
					fetch(`/api/properties/cities/${propertyData.state_id}`)
						.then(res => res.json())
						.then(citiesData => {
							console.log(
								'✅ Cities loaded on init:',
								citiesData?.length || 0,
								'items'
							)
							setCities(citiesData || [])
						})
						.catch(error =>
							console.error('❌ Error loading initial cities:', error)
						)
				}

				// Populate attributes based on property type
				if (propertyData.attributes) {
					console.log('🔧 Setting property attributes...')
					const attrs = propertyData.attributes
					setAttributes({
						bedrooms: attrs.bedrooms?.toString() || '',
						bathrooms: attrs.bathrooms?.toString() || '',
						area_sqft: attrs.area_sqft?.toString() || '',
						year_built: attrs.year_built?.toString() || '',
						lot_size_sqft: attrs.lot_size_sqft?.toString() || '',
						floors: attrs.floors?.toString() || '',
						roof_type: attrs.roof_type || '',
						floor: attrs.floor?.toString() || '',
						total_floors: attrs.total_floors?.toString() || '',
						unit_number: attrs.unit_number || '',
						business_type: attrs.business_type || '',
						ceiling_height: attrs.ceiling_height?.toString() || '',
						area_acres: attrs.area_acres?.toString() || '',
						rooms: attrs.rooms?.toString() || '',
						building_type_id: attrs.building_type_id?.toString() || '',
						business_type_id: attrs.business_type_id?.toString() || '',
					})
				}

				// Fetch existing media
				console.log('🖼️ Fetching existing media...')
				fetch(`/api/media/property/${propertyId}`)
					.then(res => res.json())
					.then(mediaData => {
						console.log(
							'📸 Media data loaded:',
							mediaData?.length || 0,
							'items'
						)
						setExistingMedia(mediaData || [])
					})
					.catch(error => console.error('Error fetching media:', error))
			})
			.catch(error => {
				console.error('❌ Edit Property: Error loading data:', error)
					showError('Չհաջողվեց բեռնել հայտարարության տվյալները')


				if (error.message.includes('Property not found')) {
				showError(`Հայտարարությունը ID ${propertyId}-ով չի գտնվել`)

				} else if (error.message.includes('Failed to fetch property: 404')) {
					showError(`Հայտարարությունը ID ${propertyId}-ով չի գտնվել կամ հեռացվել է։`)
				} else {
					setError(`Failed to load property data: ${error.message}`)
				}
				// Set safe defaults
				setStates([])
				setFeatures([])
				const fallbackStatuses = [
					{
						id: 1,
						name: 'available',
						display_name: 'Available',
						color: '#green',
						is_active: true,
						sort_order: 1,
					},
				]
				setStatuses(fallbackStatuses)
			})
			.finally(() => {
				console.log('✅ Edit Property: Data loading completed')
				setLoading(false)
			})
	}, [resolvedParams.id])

	useEffect(() => {
		// Don't fetch cities on initial load while property data is still loading
		if (loading) {
			console.log('⏳ Still loading property data, skipping city fetch')
			return
		}

		if (formData.state_id) {
			console.log('🏙️ Fetching cities for state_id:', formData.state_id)

			// Fetch cities for selected state
			fetch(`/api/properties/cities/${formData.state_id}`)
				.then(res => res.json())
				.then(data => {
					console.log('✅ Cities loaded:', data?.length || 0, 'items')
					setCities(data)
				})
				.catch(error => console.error('❌ Error fetching cities:', error))
		} else {
			console.log('❌ No state_id, clearing cities')
			setCities([])
			// Only reset city_id if we're not loading (to prevent clearing on initial load)
			if (!loading) {
				setFormData(prev => ({ ...prev, city_id: '', district_id: '' }))
			}
		}
	}, [formData.state_id, loading])

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value, type } = e.target

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			setFormData(prev => ({ ...prev, [name]: checked }))
		} else {
			setFormData(prev => ({ ...prev, [name]: value }))
		}
	}

	const handleAttributeChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target

		if (type === 'checkbox') {
			const checked = (e.target as HTMLInputElement).checked
			setAttributes(prev => ({ ...prev, [name]: checked }))
		} else {
			// ✅ Convert comma to period for decimal number fields
			let processedValue = value

			// List of fields that accept decimal values
			const decimalFields = ['ceiling_height', 'bathrooms', 'area_acres']

			if (decimalFields.includes(name) && type === 'number') {
				// Replace comma with period for decimal inputs
				processedValue = value.replace(',', '.')
			}

			setAttributes(prev => ({ ...prev, [name]: processedValue }))
		}
	}


	const handleFeatureToggle = (featureId: number) => {
		setFormData(prev => ({
			...prev,
			selectedFeatures: prev.selectedFeatures.includes(featureId)
				? prev.selectedFeatures.filter(id => id !== featureId)
				: [...prev.selectedFeatures, featureId],
		}))
	}

	const handleMediaChange = (
		files: File[],
		types: string[],
		primaryIndex: number
	) => {
		setMediaFiles(files)
		setMediaTypes(types)
		setPrimaryMediaIndex(primaryIndex)
	}

	const handleDeleteExistingMedia = async (mediaId: number) => {
		if (!confirm('Are you sure you want to delete this media?')) {
			return
		}

		try {
			const response = await fetch(`/api/media/${mediaId}`, {
				method: 'DELETE',
			})

			if (response.ok) {
				setExistingMedia(prev => prev.filter(media => media.id !== mediaId))
			} else {
				alert('Failed to delete media')
			}
		} catch (error) {
			console.error('Error deleting media:', error)
			alert('Failed to delete media')
		}
	}

	const handleSetPrimaryImage = async (mediaId: number) => {
		try {
			const response = await fetch(`/api/media/${mediaId}/primary`, {
				method: 'PUT',
			})

			if (response.ok) {
				// Update local state
				setExistingMedia(prev =>
					prev.map(media => ({
						...media,
						is_primary: media.id === mediaId && media.type === 'image',
					}))
				)
			} else {
				alert('Failed to set primary image')
			}
		} catch (error) {
			console.error('Error setting primary image:', error)
			alert('Failed to set primary image')
		}
	}

	const handleAddressSelect = (data: {
		address: string
		coordinates: { lat: number; lon: number } | null
		details?: any
	}) => {
		console.log('🏠 Address selected in add page:', data)

		// ✅ Validate coordinates exist and are valid numbers
		const hasValidCoordinates =
			data.coordinates &&
			typeof data.coordinates.lat === 'number' &&
			typeof data.coordinates.lon === 'number' &&
			!isNaN(data.coordinates.lat) &&
			!isNaN(data.coordinates.lon)

		if (!hasValidCoordinates) {
			console.warn(
				'⚠️ No valid coordinates provided for address:',
				data.address
			)
			showWarning(
				'Հասցեն պահպանվեց առանց կոորդինատների։ Խնդրում ենք ստուգել գտնվելու վայրը։'
			)
		}

		setFormData(prev => ({
			...prev,
			address: data.address,
			latitude: hasValidCoordinates ? data.coordinates!.lat : null,
			longitude: hasValidCoordinates ? data.coordinates!.lon : null,
		}))

		console.log('📍 Updated form data with coordinates:', {
			address: data.address,
			latitude: hasValidCoordinates ? data.coordinates!.lat : null,
			longitude: hasValidCoordinates ? data.coordinates!.lon : null,
			hasValidCoordinates,
		})
	}

	

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError('')

		const normalizedPrice = Number(
			String(formData.price).replace(/\s/g, '').replace(/,/g, ''),
		)

		if (!Number.isFinite(normalizedPrice)) {
			alert('Սխալ գնի ձևաչափ։')
			return
		}
		
		try {
			console.log('📝 Form data before submit:', {
				state_id: formData.state_id,
				city_id: formData.city_id,
				district_id: formData.district_id,
			})

			// Validate location fields
			if (!formData.state_id) {
				showError('Խնդրում ենք ընտրել մարզ/նահանգ')
				setSaving(false)
				return
			}


			let finalCityId = null
			let finalDistrictId = null

			// Check if the selected state uses districts (Yerevan)
			const selectedState = states.find(
				s => s.id === parseInt(formData.state_id)
			)

			console.log('🏛️ Selected state:', selectedState)

			if (selectedState?.uses_districts) {
				// For Yerevan: district_id is required, city_id stays NULL
				if (!formData.district_id) {
					showError('Խնդրում ենք ընտրել թաղամաս Երևանի համար')
					setSaving(false)
					return
				}
				console.log(
					'🏘️ Yerevan property: Using district_id, city_id will be NULL'
				)
				finalDistrictId = parseInt(formData.district_id)
				finalCityId = null
			} else {
				// For other states: city_id is required, district_id stays NULL
				if (!formData.city_id) {
					setError('Խնդրում ենք ընտրել քաղաք')
					setSaving(false)
					return
				}
				console.log(
					'🏙️ Non-Yerevan property: Using city_id, district_id will be NULL'
				)
				finalCityId = parseInt(formData.city_id)
				finalDistrictId = null
			}

			console.log('📍 Final location IDs:', {
				state_id: parseInt(formData.state_id),
				city_id: finalCityId,
				district_id: finalDistrictId,
			})

			// Prepare form data
			const propertyData = {
				...formData,
				custom_id: formData.custom_id.trim(),
				price: normalizedPrice,
				state_id: parseInt(formData.state_id),
				district_id: finalDistrictId,
				city_id: finalCityId,
				owner_name: formData.owner_name.trim(),
				owner_phone: formData.owner_phone.trim(),
				address_admin: formData.address_admin.trim(),
			}

			// Clean attributes based on property type
			const cleanedAttributes: Record<string, unknown> = {}
			switch (formData.property_type) {
				case 'house':
					Object.assign(cleanedAttributes, {
						bedrooms: attributes.bedrooms
							? parseInt(attributes.bedrooms)
							: null,
						bathrooms: attributes.bathrooms
							? parseFloat(attributes.bathrooms)
							: null,
						area_sqft: attributes.area_sqft
							? parseInt(attributes.area_sqft)
							: null,
						lot_size_sqft: attributes.lot_size_sqft
							? parseInt(attributes.lot_size_sqft)
							: null,
						floors: attributes.floors ? parseInt(attributes.floors) : null,
						ceiling_height: attributes.ceiling_height
							? parseFloat(attributes.ceiling_height)
							: null,
					})
					break
				case 'apartment':
					Object.assign(cleanedAttributes, {
						bedrooms: attributes.bedrooms
							? parseInt(attributes.bedrooms)
							: null,
						bathrooms: attributes.bathrooms
							? parseFloat(attributes.bathrooms)
							: null,
						area_sqft: attributes.area_sqft
							? parseInt(attributes.area_sqft)
							: null,
						floor: attributes.floor ? parseInt(attributes.floor) : null,
						total_floors: attributes.total_floors
							? parseInt(attributes.total_floors)
							: null,
						ceiling_height: attributes.ceiling_height
							? parseFloat(attributes.ceiling_height)
							: null,
						building_type_id: attributes.building_type_id
							? parseInt(attributes.building_type_id)
							: null,
					})
					break
				case 'commercial':
					Object.assign(cleanedAttributes, {
						area_sqft: attributes.area_sqft
							? parseInt(attributes.area_sqft)
							: null,
						floors: attributes.floors ? parseInt(attributes.floors) : null,
						ceiling_height: attributes.ceiling_height
							? parseFloat(attributes.ceiling_height)
							: null,
						rooms: attributes.rooms ? parseInt(attributes.rooms) : null,
						business_type_id: attributes.business_type_id
							? parseInt(attributes.business_type_id)
							: null,
						business_type: null,
					})
					break
				case 'land':
					Object.assign(cleanedAttributes, {
						area_acres: attributes.area_acres
							? parseFloat(attributes.area_acres)
							: null,
					})
					break
			}

			// Create FormData for file upload
			const formDataToSend = new FormData()
			formDataToSend.append('property', JSON.stringify(propertyData))
			formDataToSend.append('attributes', JSON.stringify(cleanedAttributes))

			// Add new media files
			mediaFiles.forEach(file => {
				formDataToSend.append('media', file)
			})

			// Add media types and primary index
			formDataToSend.append('mediaTypes', JSON.stringify(mediaTypes))
			formDataToSend.append('primaryMediaIndex', primaryMediaIndex.toString())

			const existingMediaWithOrder = existingMedia.map(media => ({
				id: media.id,
				display_order: media.display_order, // ✅ Use the display_order that was set during drag-drop
				is_primary: media.is_primary,
			}))

			formDataToSend.append(
				'existingMediaOrder',
				JSON.stringify(existingMediaWithOrder)
			)

			console.log('📤 Sending media order:', {
				existingCount: existingMedia.length,
				newCount: mediaFiles.length,
				existingOrders: existingMediaWithOrder.map(m => m.display_order),
				primaryMediaIndex,
			})

			console.log('🚀 Submitting property update...')

			const response = await fetch(
				`/api/admin/properties/${resolvedParams.id}`,
				{
					method: 'PUT',
					body: formDataToSend,
				}
			)

			const data = await response.json()

			if (!response.ok) {
				showError(data.error || 'Չհաջողվեց թարմացնել հայտարարությունը')
				throw new Error(data.error || 'Failed to update property')
			}

			showSuccess('Հայտարարությունը հաջողությամբ թարմացվել է')
			setTimeout(() => {
				router.push('/admin')
			}, 2000)
		} catch (error) {
			console.error('❌ Error updating property:', error)
			if (!toasts.some(t => t.type === 'error')) {
				showError(
					error instanceof Error
						? error.message
						: 'Չհաջողվեց թարմացնել հայտարարությունը'
				)
			}
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} finally {
			setSaving(false)
		}
	}

	const propertyTypeIcons = {
		house: Home,
		apartment: Building2,
		commercial: Landmark,
		land: Trees,
	}

	const propertyTypeDisplay: Record<PropertyType, string> = {
		house: 'տուն',
		apartment: 'բնակարան',
		commercial: 'կոմերցիոն',
		land: 'հող',
	}

	const listingTypeDisplay: Record<ListingType, string> = {
		sale: 'Վաճառք',
		rent: 'Վարձակալություն',
		daily_rent: 'Օրյա վարձակալություն',
	}

	// Get status color class
	const getStatusColorClass = (color: string) => {
		const colorMap: Record<string, string> = {
			'#green': 'bg-green-100 text-green-800',
			'#blue': 'bg-blue-100 text-blue-800',
			'#red': 'bg-red-100 text-red-800',
			'#yellow': 'bg-yellow-100 text-yellow-800',
			'#purple': 'bg-purple-100 text-purple-800',
			'#indigo': 'bg-indigo-100 text-indigo-800',
			'#gray': 'bg-gray-100 text-gray-800',
		}
		return colorMap[color] || 'bg-gray-100 text-gray-800'
	}

	if (loading) {
		return (
			<AdminLayout>
				<div className='flex items-center justify-center min-h-96'>
					<Loader2 className='w-8 h-8 animate-spin' />
				</div>
			</AdminLayout>
		)
	}

	return (
		<AdminLayout>
			<ToastContainer toasts={toasts} onRemove={removeToast} />
			<div className='max-w-4xl mx-auto'>
				<div className='mb-8'>
					<h1 className='text-2xl font-bold text-gray-900'>
						Փոփոխել անշարժ գույքը
					</h1>
				</div>
				<form onSubmit={handleSubmit} className='space-y-8'>
					{/* Basic Information */}
					<div className='bg-white shadow rounded-lg p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='md:col-span-2'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Անուն
								</label>
								<input
									type='text'
									name='title'
									value={formData.title}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Enter property title'
								/>
							</div>
						</div>

						<div className='md:col-span-2 mt-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Նկարագրություն
							</label>
							<textarea
								name='description'
								value={formData.description}
								onChange={handleInputChange}
								rows={4}
								className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder='Enter property description'
							/>
						</div>

						<div className='mt-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Անշարժ գույքի տեսակը
							</label>
							<div className='grid grid-cols-2 gap-2'>
								{(
									['house', 'apartment', 'commercial', 'land'] as PropertyType[]
								).map(type => {
									const Icon = propertyTypeIcons[type]
									return (
										<button
											key={type}
											type='button'
											onClick={() =>
												setFormData(prev => ({
													...prev,
													property_type: type,
												}))
											}
											className={`flex items-center justify-center p-3 border rounded-lg ${
												formData.property_type === type
													? 'border-blue-500 bg-blue-50 text-blue-600'
													: 'border-gray-300 text-gray-700 hover:bg-gray-50'
											}`}
										>
											<Icon className='w-5 h-5 mr-2' />
											{propertyTypeDisplay[type]}
										</button>
									)
								})}
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Անշարժ գույքի ID
								</label>
								<input
									type='text'
									name='custom_id'
									value={formData.custom_id}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='e.g., GL100'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Հայտարարության տեսակը
								</label>
								<select
									name='listing_type'
									value={formData.listing_type}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									{(Object.keys(listingTypeDisplay) as ListingType[]).map(
										type => (
											<option key={type} value={type}>
												{listingTypeDisplay[type]}
											</option>
										)
									)}
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Գինը
								</label>
								<div className='flex gap-2'>
									<select
										name='currency'
										value={formData.currency}
										onChange={handleInputChange}
										className='border border-r-0 text-gray-700 border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50'
									>
										<option value='USD'>USD ($)</option>
										<option value='AMD'>AMD (֏)</option>
									</select>
									<input
										type='text'
										inputMode='numeric'
										name='price'
										value={formData.price}
										onChange={handleInputChange}
										required
										className='flex-1 border border-gray-300 text-black rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Մուտքագրեք գինը'
									/>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Կարգավիճակ
								</label>
								<select
									name='status'
									value={formData.status}
									onChange={handleInputChange}
									className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									{statuses.map(status => (
										<option key={status.id} value={status.name}>
											{statusNameDisplay[status.name] || status.name}
										</option>
									))}
								</select>
								{/* Show status preview */}
								{formData.status && (
									<div className='mt-2'>
										{(() => {
											const selectedStatus = statuses.find(
												s => s.name === formData.status
											)
											return selectedStatus ? (
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(
														selectedStatus.color
													)}`}
												>
													{statusNameDisplay[selectedStatus.name] ||
														selectedStatus.name}
												</span>
											) : null
										})()}
									</div>
								)}
							</div>
						</div>
					</div>
					{/* 3D Virtual Tour URL */}
					<div className='bg-white shadow rounded-lg p-6 border-l-4 border-purple-500'>
						<h2 className='text-lg font-semibold mb-6 flex items-center text-gray-700'>
							<Boxes className='w-5 h-5 mr-2' />
							3D Վիրտուալ տուր
						</h2>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								3D տուրի հղում (ըստ ցանկության)
							</label>
							<input
								type='url'
								name='url_3d'
								value={formData.url_3d}
								onChange={handleInputChange}
								className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
								placeholder='https://example.com/3d-tour'
							/>
							<p className='mt-2 text-sm text-gray-500'>
								Մուտքագրեք հղումը Matterport, Kuula կամ այլ 3D տուրի
								ծառայություններից
							</p>
						</div>
					</div>
					{/* Property Visibility Settings */}
					<div className='bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500'>
						<h2 className='text-lg font-semibold mb-6 flex items-center text-gray-700'>
							<Eye className='w-5 h-5 mr-2' />
							Տեսանելիության կարգավորումներ
						</h2>

						<div className='space-y-4'>
							<div className='flex items-center'>
								<input
									type='checkbox'
									id='is_hidden'
									name='is_hidden'
									checked={formData.is_hidden}
									onChange={handleInputChange}
									className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
								/>
								<label
									htmlFor='is_hidden'
									className='ml-3 text-sm font-medium text-gray-700'
								>
									<span className='flex items-center'>
										<EyeOff className='w-4 h-4 mr-2 text-red-500' />
										Թաքցնել կայքում
									</span>
								</label>
							</div>

							<div className='flex items-center'>
								<input
									type='checkbox'
									id='is_exclusive'
									name='is_exclusive'
									checked={formData.is_exclusive}
									onChange={handleInputChange}
									className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
								/>
								<label
									htmlFor='is_exclusive'
									className='ml-3 text-sm font-medium text-gray-700'
								>
									<span className='flex items-center'>
										<Crown className='w-4 h-4 mr-2 text-purple-500' />
										Նշել որպես էքսկլյուզիվ
									</span>
								</label>
							</div>
							<div className='space-y-4'>
								<div className='flex items-center'>
									<input
										type='checkbox'
										id='is_top'
										name='is_top'
										checked={formData.is_top}
										onChange={handleInputChange}
										className='w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500'
									/>
									<label
										htmlFor='is_top'
										className='ml-3 text-sm font-medium text-gray-700'
									>
										<span className='flex items-center'>
											<Flame className='w-4 h-4 mr-2 text-yellow-500' />
											Նշել որպես տոպ հայտարարություն
										</span>
									</label>
								</div>

								<div className='flex items-center'>
									<input
										type='checkbox'
										id='is_urgently'
										name='is_urgently'
										checked={formData.is_urgently}
										onChange={handleInputChange}
										className='w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500'
									/>
									<label
										htmlFor='is_urgently'
										className='ml-3 text-sm font-medium text-gray-700'
									>
										<span className='flex items-center'>
											<AlertCircle className='w-4 h-4 mr-2 text-red-500' />
											Նշել որպես շտապ հայտարարություն
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>
					{/* Owner Information */}
					<div className='bg-white shadow rounded-lg p-6 border-l-4 border-red-500'>
						<h2 className='text-lg font-semibold mb-6 flex items-center text-gray-700'>
							<User className='w-5 h-5 mr-2' />
							Սեփականատիրոջ տեղեկություններ (միայն ադմինիստրատորի համար)
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Սեփականատիրոջ անունը
								</label>
								<input
									type='text'
									name='owner_name'
									value={formData.owner_name}
									onChange={handleInputChange}
									className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent'
									placeholder='Enter owner name'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Սեփականատիրոջ հեռախոսահամարը
								</label>
								<input
									type='tel'
									name='owner_phone'
									value={formData.owner_phone}
									onChange={handleInputChange}
									className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent'
									placeholder='Enter owner phone number'
								/>
							</div>
						</div>
						<h2 className='text-lg p-2 font-semibold mb-6 flex items-center text-gray-700'>
							<Phone className='w-5 h-5 mr-2' />
							Կապի եղանակներ
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='flex items-center'>
								<input
									type='checkbox'
									id='has_viber'
									name='has_viber'
									checked={formData.has_viber}
									onChange={handleInputChange}
									className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
								/>
								<label
									htmlFor='has_viber'
									className='ml-3 text-sm font-medium text-gray-700 flex items-center'
								>
									<span className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2'>
										V
									</span>
									Viber
								</label>
							</div>

							<div className='flex items-center'>
								<input
									type='checkbox'
									id='has_whatsapp'
									name='has_whatsapp'
									checked={formData.has_whatsapp}
									onChange={handleInputChange}
									className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
								/>
								<label
									htmlFor='has_whatsapp'
									className='ml-3 text-sm font-medium text-gray-700 flex items-center'
								>
									<span className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-2'>
										W
									</span>
									WhatsApp
								</label>
							</div>

							<div className='flex items-center'>
								<input
									type='checkbox'
									id='has_telegram'
									name='has_telegram'
									checked={formData.has_telegram}
									onChange={handleInputChange}
									className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
								/>
								<label
									htmlFor='has_telegram'
									className='ml-3 text-sm font-medium text-gray-700 flex items-center'
								>
									<span className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2'>
										T
									</span>
									Telegram
								</label>
							</div>
						</div>
						<div className='mt-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Ադմինիստրատորի հասցե
							</label>
							<input
								type='text'
								name='address_admin'
								value={formData.address_admin}
								onChange={handleInputChange}
								className='block w-full border border-gray-300 rounded-lg px-4 py-2 text-black focus:ring-2 focus:ring-red-500 focus:border-transparent'
								placeholder='Մուտքագրեք հասցեն (միայն ադմինիստրատորի համար)'
							/>
						</div>
					</div>
					{/* Location Information */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 flex items-center text-gray-700'>
							<MapPin className='w-5 h-5 mr-2' />
							Տեղանքի տեղեկատվություն
						</h2>
						<LocationSelector
							stateId={formData.state_id}
							cityId={formData.city_id}
							districtId={formData.district_id}
							onStateChange={stateId =>
								setFormData(prev => ({
									...prev,
									state_id: stateId,
									city_id: '', // Reset city when state changes
									district_id: '', // Reset district when state changes
								}))
							}
							onCityChange={cityId =>
								setFormData(prev => ({
									...prev,
									city_id: cityId,
								}))
							}
							onDistrictChange={districtId =>
								setFormData(prev => ({
									...prev,
									district_id: districtId,
								}))
							}
							required={true}
						/>
						<div className='mt-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Հասցե <span className='text-red-500'>*</span>
							</label>
							<FallbackAddressInput
								onAddressSelect={handleAddressSelect}
								initialValue={formData.address}
								placeholder='Մուտքագրեք անշարժ գույքի հասցեն...'
								required={true}
								className='w-full'
							/>
						</div>
					</div>
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 text-gray-700'>
							Հայտարարության մանրամասները
						</h2>

						{/* House Attributes */}
						{formData.property_type === 'house' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Ննջասենյակներ
									</label>
									<input
										type='number'
										name='bedrooms'
										value={attributes.bedrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Լոգարաններ
									</label>
									<input
										type='number'
										name='bathrooms'
										value={attributes.bathrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.5'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Մակերես (քառակուսի մետր)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Տարածքի մակերես (քառակուսի մետր)
									</label>
									<input
										type='number'
										name='lot_size_sqft'
										value={attributes.lot_size_sqft}
										onChange={handleAttributeChange}
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Հարկեր
									</label>
									<input
										type='number'
										name='floors'
										value={attributes.floors}
										onChange={handleAttributeChange}
										min='1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Առաստաղի բարձրությունը (մետր)
									</label>
									<input
										type='text'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='օր․ 3.0'
										required
										pattern='[0-9]+([.,][0-9]+)?'
									/>
								</div>
							</div>
						)}

						{/* Apartment Attributes */}
						{formData.property_type === 'apartment' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Ննջասենյակներ
									</label>
									<input
										type='number'
										name='bedrooms'
										value={attributes.bedrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Լոգարաններ
									</label>
									<input
										type='number'
										name='bathrooms'
										value={attributes.bathrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.5'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Մակերես (քառակուսի մետր)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Հարկ
									</label>
									<input
										type='number'
										name='floor'
										value={attributes.floor}
										onChange={handleAttributeChange}
										required
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Հարկերի ընդհանուր քանակը
									</label>
									<input
										type='number'
										name='total_floors'
										value={attributes.total_floors}
										onChange={handleAttributeChange}
										required
										min='1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Առաստաղի բարձրությունը (մետր)
									</label>
									<input
										type='text'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='օր․ 3.0'
										required
										pattern='[0-9]+([.,][0-9]+)?'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Շենքի տեսակ
									</label>
									<select
										name='building_type_id'
										value={attributes.building_type_id}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>Ընտրել շենքի տեսակը</option>
										{apartmentBuildingTypes.map(type => (
											<option key={type.id} value={type.id}>
												{type.name_hy}
											</option>
										))}
									</select>
								</div>
							</div>
						)}

						{/* Commercial Attributes */}
						{formData.property_type === 'commercial' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Բիզնեսի տեսակը
									</label>
									<select
										name='business_type_id'
										value={attributes.business_type_id}
										onChange={handleAttributeChange}
										required
										className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>Ընտրել բիզնեսի տեսակը</option>
										{commercialBusinessTypes.map(type => (
											<option key={type.id} value={type.id}>
												{type.name_hy}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Մակերես (քառակուսի մետր)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Հարկեր
									</label>
									<input
										type='number'
										name='floors'
										value={attributes.floors}
										onChange={handleAttributeChange}
										min='1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										required
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Առաստաղի բարձրությունը (մետր)
									</label>
									<input
										type='text'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='օր․ 3.0'
										required
										pattern='[0-9]+([.,][0-9]+)?'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Սենյակներ
									</label>
									<input
										type='number'
										name='rooms'
										value={attributes.rooms}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										required
										min='0'
									/>
								</div>
							</div>
						)}

						{/* Land Attributes */}
						{formData.property_type === 'land' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Մակերես (քառակուսի մետր)
									</label>
									<input
										type='number'
										name='area_acres'
										value={attributes.area_acres}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.01'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
							</div>
						)}
					</div>
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 text-gray-700'>
							Հատկանիշներ և հարմարություններ
						</h2>
						<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
							{features.map(feature => (
								<div key={feature.id} className='flex items-center'>
									<input
										type='checkbox'
										checked={formData.selectedFeatures.includes(feature.id)}
										onChange={() => handleFeatureToggle(feature.id)}
										className='w-4 h-4 text-blue-600 border-gray-300 rounded'
									/>
									<label className='ml-2 text-sm text-gray-700'>
										{feature.name}
									</label>
								</div>
							))}
						</div>
					</div>

					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg text-gray-700 font-semibold mb-6 flex items-center'>
							<ImageIcon className='w-5 h-5 mr-2' />
							Մեդիա ֆայլերի կառավարում
						</h2>

						<MediaEditManager
							existingMedia={existingMedia}
							onExistingMediaChange={setExistingMedia}
							onNewMediaChange={handleMediaChange}
							onDeleteExisting={handleDeleteExistingMedia}
						/>
					</div>
					{/* Submit Button */}
					<div className='flex justify-end space-x-4'>
						<button
							type='button'
							onClick={() => router.push('/admin')}
							className='px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
						>
							Չեղարկել
						</button>
						<button
							type='submit'
							disabled={saving}
							className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
						>
							{saving ? (
								<>
									<Loader2 className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></Loader2>
									Պահպանվում է...
								</>
							) : (
								<>
									<Save className='w-5 h-5 mr-2' />
									Պահպանել փոփոխությունները
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</AdminLayout>
	)
}
