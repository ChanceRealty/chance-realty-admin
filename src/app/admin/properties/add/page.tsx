// src/app/admin/properties/add/page.tsx - FIXED with translated status names
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import MediaUploadIntegrated from '@/components/MediaUpload'
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
	Plus,
	MapPin,
	Image as ImageIcon,
	User,
	Phone,
	Eye,
	EyeOff,
	Crown,
} from 'lucide-react'
import LocationSelector from '@/components/LocationSelector'
import FallbackAddressInput from '@/components/FallbackAddressInput'

export default function AddPropertyPage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [features, setFeatures] = useState<PropertyFeature[]>([])
	const [statuses, setStatuses] = useState<PropertyStatus[]>([])
	const [mediaFiles, setMediaFiles] = useState<File[]>([])
	const [mediaTypes, setMediaTypes] = useState<string[]>([])
	const [primaryMediaIndex, setPrimaryMediaIndex] = useState(0)

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
		latitude: null as number | null,
		longitude: null as number | null,
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
		console.log('🚀 Add Property: Starting data fetch...')

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
		])
			.then(([statesData, featuresData, statusesData]) => {
				console.log('✅ Add Property: All data fetched successfully:')
				console.log('📍 States:', statesData?.length || 0, 'items')
				console.log('🏷️ Features:', featuresData?.length || 0, 'items')
				console.log('📊 Statuses:', statusesData?.length || 0, 'items')
				console.log('📊 First status:', statusesData?.[0])

				setStates(statesData || [])
				setFeatures(featuresData || [])

				// ✅ Add safety check for statuses with better error handling
				if (Array.isArray(statusesData) && statusesData.length > 0) {
					console.log('✅ Setting statuses:', statusesData)
					setStatuses(statusesData)

					// Set default status to first available status
					const defaultStatus =
						statusesData.find(s => s.name === 'available') || statusesData[0]
					console.log('🎯 Setting default status:', defaultStatus?.name)
					setFormData(prev => ({ ...prev, status: defaultStatus.name }))
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
					setFormData(prev => ({ ...prev, status: 'available' }))
				}
			})
			.catch(error => {
				console.error('❌ Add Property: Error fetching data:', error)
				// Set safe defaults to prevent crashes
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
				setFormData(prev => ({ ...prev, status: 'available' }))
			})
	}, [])

	useEffect(() => {
		if (formData.state_id) {
			// Fetch cities for selected state
			fetch(`/api/properties/cities/${formData.state_id}`)
				.then(res => res.json())
				.then(data => setCities(data))
				.catch(error => console.error('Error fetching cities:', error))
		} else {
			setCities([])
			setFormData(prev => ({ ...prev, city_id: '' }))
		}
	}, [formData.state_id])

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
			setAttributes(prev => ({ ...prev, [name]: value }))
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {

			let finalCityId = null
			let finalDistrictId = null

			// Check if the selected state uses districts (Yerevan)
			const selectedState = states.find(
				s => s.id === parseInt(formData.state_id)
			)

			if (selectedState?.uses_districts) {
				// For Yerevan: district_id is set, city_id stays NULL
				console.log(
					'🏘️ Yerevan property: Using district_id, city_id will be NULL'
				)
				finalDistrictId = formData.district_id
					? parseInt(formData.district_id)
					: null
				finalCityId = null // Important: city_id is NULL for Yerevan
			} else {
				// For other states: city_id is set, district_id stays NULL
				console.log(
					'🏙️ Non-Yerevan property: Using city_id, district_id will be NULL'
				)
				finalCityId = formData.city_id ? parseInt(formData.city_id) : null
				finalDistrictId = null // Important: district_id is NULL for non-Yerevan
			}
			// Prepare form data
			const propertyData = {
				...formData,
				custom_id: formData.custom_id.trim(),
				latitude: formData.latitude,
				longitude: formData.longitude,
				price: parseFloat(formData.price),
				state_id: parseInt(formData.state_id),
				city_id: finalCityId, // ✅ NULL for Yerevan
				district_id: finalDistrictId, // ✅ NULL for non-Yerevan
				owner_name: formData.owner_name.trim(),
				owner_phone: formData.owner_phone.trim(),
				address_admin: formData.address_admin.trim(),
			}

			// Clean attributes based on property type
			const cleanedAttributes: Record<string, unknown> = {}
			switch (formData.property_type) {
				case 'house':
					Object.assign(cleanedAttributes, {
						bedrooms: parseInt(attributes.bedrooms),
						bathrooms: parseFloat(attributes.bathrooms),
						area_sqft: parseInt(attributes.area_sqft),
						lot_size_sqft: attributes.lot_size_sqft
							? parseInt(attributes.lot_size_sqft)
							: null,
						floors: attributes.floors ? parseInt(attributes.floors) : null,
						ceiling_height: attributes.ceiling_height // ✅ Added for houses
							? parseFloat(attributes.ceiling_height)
							: null,
					})
					break
				case 'apartment':
					Object.assign(cleanedAttributes, {
						bedrooms: parseInt(attributes.bedrooms),
						bathrooms: parseFloat(attributes.bathrooms),
						area_sqft: parseInt(attributes.area_sqft),
						floor: parseInt(attributes.floor),
						total_floors: parseInt(attributes.total_floors),
						ceiling_height: attributes.ceiling_height // ✅ Added for houses
							? parseFloat(attributes.ceiling_height)
							: null,
					})
					break
				case 'commercial':
					Object.assign(cleanedAttributes, {
						business_type: attributes.business_type,
						area_sqft: parseInt(attributes.area_sqft),
						floors: attributes.floors ? parseInt(attributes.floors) : null,
						ceiling_height: attributes.ceiling_height
							? parseFloat(attributes.ceiling_height)
							: null,
					})
					break
				case 'land':
					Object.assign(cleanedAttributes, {
						area_acres: parseFloat(attributes.area_acres),
					})
					break
			}

			// Create FormData for file upload
			const formDataToSend = new FormData()
			formDataToSend.append('property', JSON.stringify(propertyData))
			formDataToSend.append('attributes', JSON.stringify(cleanedAttributes))

			// Add media files
			mediaFiles.forEach(file => {
				formDataToSend.append('media', file)
			})

			// Add media types and primary index
			formDataToSend.append('mediaTypes', JSON.stringify(mediaTypes))
			formDataToSend.append('primaryMediaIndex', primaryMediaIndex.toString())

			const response = await fetch('/api/admin/properties', {
				method: 'POST',
				body: formDataToSend,
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create property')
			}

			router.push('/admin')
		} catch (error) {
			console.error('Error creating property:', error)
			setError(
				error instanceof Error ? error.message : 'Failed to create property'
			)
		} finally {
			setLoading(false)
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

	const handleAddressSelect = (data: {
		address: string
		coordinates: { lat: number; lon: number } | null
		details?: any
	}) => {
		console.log('🏠 Address selected in add page:', data)

		setFormData(prev => ({
			...prev,
			address: data.address, // ✅ Use the selected/formatted address
			latitude: data.coordinates?.lat || null, // ✅ Save latitude
			longitude: data.coordinates?.lon || null, // ✅ Save longitude
		}))

		// Log the update for debugging
		console.log('📍 Updated form data with coordinates:', {
			address: data.address,
			latitude: data.coordinates?.lat,
			longitude: data.coordinates?.lon,
		})
	}

	return (
		<AdminLayout>
			<div className='max-w-4xl mx-auto'>
				<div className='mb-8'>
					<h1 className='text-2xl font-bold text-gray-900'>
						Ավելացնել նոր անշարժ գույք
					</h1>
					<p className='text-gray-500'>
						Լրացրեք տվյալները՝ նոր անշարժ գույքի Հայտարարություն ստեղծելու համար
					</p>
				</div>

				{error && (
					<div className='mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-8'>
					{/* Basic Information */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 text-gray-700'>
							Հիմնական տեղեկություններ
						</h2>

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
									placeholder='Մուտքագրեք անշարժ գույքի անունը'
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
								placeholder='Մուտքագրեք անշարժ գույքի նկարագրությունը'
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
									className='w-full border text-black border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Մուտքագրեք անշարժ գույքի ID-ն'
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
								<div className='flex'>
									<select
										name='currency'
										value={formData.currency}
										onChange={handleInputChange}
										className='border border-r-0 text-gray-700 border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50'
									>
										<option value='USD'>USD</option>
									</select>
									<input
										type='number'
										name='price'
										value={formData.price}
										onChange={handleInputChange}
										required
										min='0'
										step='0.01'
										className='flex-1 border text-black border-gray-300 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
													Թաքցնել հանրային ցուցակից
												</span>
											</label>
										</div>
										{formData.is_hidden && (
											<div className='ml-7 p-3 bg-red-50 border border-red-200 rounded-lg'>
												<p className='text-sm text-red-800'>
													⚠️ Այս հայտարարությունը չի ցուցադրվի հանրային կայքում։
													Միայն ադմինիստրատորները կարող են այն տեսնել։
												</p>
											</div>
										)}

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
										{formData.is_exclusive && (
											<div className='ml-7 p-3 bg-purple-50 border border-purple-200 rounded-lg'>
												<p className='text-sm text-purple-800'>
													✨ Այս հայտարարությունը կնշվի որպես էքսկլյուզիվ և
													կունենա հատուկ նշան։
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Owner Information (Admin Only) */}
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
									required
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
									required
									className='w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent'
									placeholder='Enter owner phone number'
								/>
							</div>
						</div>

						<div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
							<p className='text-sm text-yellow-800'>
								⚠️ Այս տեղեկությունները հանրային կայքում չեն ցուցադրվի և միայն
								ադմինիստրատորի համար են։
							</p>
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
							<p className='text-sm text-gray-500 mt-1'>
								Սկսեք մուտքագրել հասցեն և ընտրեք առաջարկությունների ցուցակից
							</p>
						</div>
					</div>

					{/* Property Attributes */}
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
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Առաստաղի բարձրությունը (մետր)
									</label>
									<input
										type='number'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										min='0'
										step='0.1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='օր․ 3.0'
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
										type='number'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										min='0'
										step='0.1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='օր․ 3.0'
									/>
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
									<input
										type='text'
										name='business_type'
										value={attributes.business_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
										placeholder='e.g., Office, Retail, Warehouse'
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
										Հարկեր
									</label>
									<input
										type='number'
										name='floors'
										value={attributes.floors}
										onChange={handleAttributeChange}
										min='1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Առաստաղի բարձրությունը (մետր)
									</label>
									<input
										type='number'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										min='0'
										step='0.1'
										className='w-full border border-gray-300 text-black rounded-lg px-4 py-2'
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

					{/* Features */}
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

					{/* Property Media */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg text-gray-700 font-semibold mb-6 flex items-center'>
							<ImageIcon className='w-5 h-5 mr-2' />
							Հայտարարության նկարները և տեսանյութերը
						</h2>

						<MediaUploadIntegrated onMediaChange={handleMediaChange} />
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
							disabled={loading}
							className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
						>
							{loading ? (
								<>
									<span className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></span>
									Ստեղծվում է...
								</>
							) : (
								<>
									<Plus className='w-5 h-5 mr-2' />
									Ստեղծել
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</AdminLayout>
	)
}
