// src/app/admin/properties/add/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import {
	PropertyType,
	ListingType,
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
	X,
	Upload,
	MapPin,
	Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'

export default function AddPropertyPage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [features, setFeatures] = useState<PropertyFeature[]>([])

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
		address: '',
		postal_code: '',
		latitude: '',
		longitude: '',
		featured: false,
		selectedFeatures: [] as number[],
	})

	// Property type specific attributes
  const [attributes, setAttributes] = useState<{
    bedrooms: string
    bathrooms: string
    area_sqft: string
    year_built: string
    lot_size_sqft: string
    floors: string
    garage_spaces: string
    basement: boolean
    heating_type: string
    cooling_type: string
    roof_type: string
    floor: string
    total_floors: string
    unit_number: string
    building_name: string
    parking_spaces: string
    balcony: boolean
    elevator: boolean
    security_system: boolean
    pet_friendly: boolean
    business_type: string
    loading_dock: boolean
    zoning_type: string
    ceiling_height: string
    area_acres: string
    topography: string
    road_access: boolean
    utilities_available: boolean
    is_fenced: boolean
    soil_type: string
    water_rights: boolean
    mineral_rights: boolean
  }>({
	bedrooms: '',
	bathrooms: '',
	area_sqft: '',
	year_built: '',
	lot_size_sqft: '',
	floors: '',
	garage_spaces: '',
	basement: false,
	heating_type: '',
	cooling_type: '',
	roof_type: '',
	floor: '',
	total_floors: '',
	unit_number: '',
	building_name: '',
	parking_spaces: '',
	balcony: false,
	elevator: false,
	security_system: false,
	pet_friendly: false,
	business_type: '',
	loading_dock: false,
	zoning_type: '',
	ceiling_height: '',
	area_acres: '',
	topography: '',
	road_access: false,
	utilities_available: false,
	is_fenced: false,
	soil_type: '',
	water_rights: false,
	mineral_rights: false,
  });

	// Image handling
	const [images, setImages] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

	useEffect(() => {
		// Fetch states
		fetch('/api/properties/states')
			.then(res => res.json())
			.then(data => setStates(data))
			.catch(error => console.error('Error fetching states:', error))

		// Fetch features
		fetch('/api/properties/features')
			.then(res => res.json())
			.then(data => setFeatures(data))
			.catch(error => console.error('Error fetching features:', error))
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

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files)
			setImages(prev => [...prev, ...newFiles])

			// Create preview URLs
			const newPreviews = newFiles.map(file => URL.createObjectURL(file))
			setImagePreviews(prev => [...prev, ...newPreviews])
		}
	}

	const removeImage = (index: number) => {
		setImages(prev => prev.filter((_, i) => i !== index))
		setImagePreviews(prev => prev.filter((_, i) => i !== index))

		// Adjust primary image index if needed
		if (primaryImageIndex === index) {
			setPrimaryImageIndex(0)
		} else if (primaryImageIndex > index) {
			setPrimaryImageIndex(prev => prev - 1)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			// Prepare form data
			const propertyData = {
				...formData,
				custom_id: formData.custom_id.trim(),
				price: parseFloat(formData.price),
				state_id: parseInt(formData.state_id),
				city_id: parseInt(formData.city_id),
				latitude: formData.latitude ? parseFloat(formData.latitude) : null,
				longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
						year_built: attributes.year_built
							? parseInt(attributes.year_built)
							: null,
						garage_spaces: parseInt(attributes.garage_spaces) || 0,
						basement: attributes.basement,
						heating_type: attributes.heating_type,
						cooling_type: attributes.cooling_type,
						roof_type: attributes.roof_type,
					})
					break
				case 'apartment':
					Object.assign(cleanedAttributes, {
						bedrooms: parseInt(attributes.bedrooms),
						bathrooms: parseFloat(attributes.bathrooms),
						area_sqft: parseInt(attributes.area_sqft),
						floor: parseInt(attributes.floor),
						total_floors: parseInt(attributes.total_floors),
						unit_number: attributes.unit_number,
						building_name: attributes.building_name,
						year_built: attributes.year_built
							? parseInt(attributes.year_built)
							: null,
						parking_spaces: parseInt(attributes.parking_spaces) || 0,
						balcony: attributes.balcony,
						elevator: attributes.elevator,
						security_system: attributes.security_system,
						pet_friendly: attributes.pet_friendly,
					})
					break
				case 'commercial':
					Object.assign(cleanedAttributes, {
						business_type: attributes.business_type,
						area_sqft: parseInt(attributes.area_sqft),
						floors: attributes.floors ? parseInt(attributes.floors) : null,
						year_built: attributes.year_built
							? parseInt(attributes.year_built)
							: null,
						parking_spaces: parseInt(attributes.parking_spaces) || 0,
						loading_dock: attributes.loading_dock,
						zoning_type: attributes.zoning_type,
						ceiling_height: attributes.ceiling_height
							? parseFloat(attributes.ceiling_height)
							: null,
					})
					break
				case 'land':
					Object.assign(cleanedAttributes, {
						area_acres: parseFloat(attributes.area_acres),
						zoning_type: attributes.zoning_type,
						topography: attributes.topography,
						road_access: attributes.road_access,
						utilities_available: attributes.utilities_available,
						is_fenced: attributes.is_fenced,
						soil_type: attributes.soil_type,
						water_rights: attributes.water_rights,
						mineral_rights: attributes.mineral_rights,
					})
					break
			}

			// Create FormData for file upload
			const formDataToSend = new FormData()
			formDataToSend.append('property', JSON.stringify(propertyData))
			formDataToSend.append('attributes', JSON.stringify(cleanedAttributes))

			// Add images
			images.forEach((image) => {
				formDataToSend.append('images', image)
			})
			formDataToSend.append('primaryImageIndex', primaryImageIndex.toString())

			const response = await fetch('/api/admin/properties', {
				method: 'POST',
				body: formDataToSend,
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create property')
			}

			router.push('/admin/properties')
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

	return (
		<AdminLayout>
			<div className='max-w-4xl mx-auto'>
				<div className='mb-8'>
					<h1 className='text-2xl font-bold text-gray-900'>Add New Property</h1>
					<p className='text-gray-500'>
						Fill in the details to create a new property listing
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
						<h2 className='text-lg font-semibold mb-6'>Basic Information</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='md:col-span-2'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Property Title
								</label>
								<input
									type='text'
									name='title'
									value={formData.title}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Enter property title'
								/>
							</div>
						</div>

						<div className='md:col-span-2'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Description
							</label>
							<textarea
								name='description'
								value={formData.description}
								onChange={handleInputChange}
								rows={4}
								className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder='Enter property description'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Property Type
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
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</button>
									)
								})}
							</div>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Property ID
								</label>
								<input
									type='text'
									name='custom_id'
									value={formData.custom_id}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='e.g., GL100'
								/>
								<p className='mt-1 text-sm text-gray-500'>
									This ID will be used in the property URL
								</p>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Property Title
								</label>
								<input
									type='text'
									name='title'
									value={formData.title}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Enter property title'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Listing Type
								</label>
								<select
									name='listing_type'
									value={formData.listing_type}
									onChange={handleInputChange}
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='sale'>For Sale</option>
									<option value='rent'>For Rent</option>
									<option value='daily_rent'>Daily Rent</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Price
								</label>
								<div className='flex'>
									<select
										name='currency'
										value={formData.currency}
										onChange={handleInputChange}
										className='border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50'
									>
										<option value='USD'>USD</option>
										<option value='EUR'>EUR</option>
										<option value='GBP'>GBP</option>
									</select>
									<input
										type='number'
										name='price'
										value={formData.price}
										onChange={handleInputChange}
										required
										min='0'
										step='0.01'
										className='flex-1 border border-gray-300 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Enter price'
									/>
								</div>
							</div>

							<div className='flex items-center'>
								<input
									type='checkbox'
									name='featured'
									checked={formData.featured}
									onChange={handleInputChange}
									className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
								/>
								<label className='ml-2 text-sm text-gray-700'>
									Featured Property
								</label>
							</div>
						</div>
					</div>

					{/* Location Information */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 flex items-center'>
							<MapPin className='w-5 h-5 mr-2' />
							Location Information
						</h2>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									State
								</label>
								<select
									name='state_id'
									value={formData.state_id}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value=''>Select State</option>
									{states.map(state => (
										<option key={state.id} value={state.id}>
											{state.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									City
								</label>
								<select
									name='city_id'
									value={formData.city_id}
									onChange={handleInputChange}
									required
									disabled={!formData.state_id}
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
								>
									<option value=''>Select City</option>
									{cities.map(city => (
										<option key={city.id} value={city.id}>
											{city.name}
										</option>
									))}
								</select>
							</div>

							<div className='md:col-span-2'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Address
								</label>
								<input
									type='text'
									name='address'
									value={formData.address}
									onChange={handleInputChange}
									required
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Enter property address'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Postal Code
								</label>
								<input
									type='text'
									name='postal_code'
									value={formData.postal_code}
									onChange={handleInputChange}
									className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder='Enter postal code'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Coordinates (Optional)
								</label>
								<div className='flex space-x-2'>
									<input
										type='number'
										name='latitude'
										value={formData.latitude}
										onChange={handleInputChange}
										step='any'
										className='flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Latitude'
									/>
									<input
										type='number'
										name='longitude'
										value={formData.longitude}
										onChange={handleInputChange}
										step='any'
										className='flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										placeholder='Longitude'
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Property Attributes */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6'>Property Details</h2>

						{/* House Attributes */}
						{formData.property_type === 'house' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Bedrooms
									</label>
									<input
										type='number'
										name='bedrooms'
										value={attributes.bedrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Bathrooms
									</label>
									<input
										type='number'
										name='bathrooms'
										value={attributes.bathrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.5'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Area (sq ft)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Lot Size (sq ft)
									</label>
									<input
										type='number'
										name='lot_size_sqft'
										value={attributes.lot_size_sqft}
										onChange={handleAttributeChange}
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Floors
									</label>
									<input
										type='number'
										name='floors'
										value={attributes.floors}
										onChange={handleAttributeChange}
										min='1'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Year Built
									</label>
									<input
										type='number'
										name='year_built'
										value={attributes.year_built}
										onChange={handleAttributeChange}
										min='1800'
										max={new Date().getFullYear()}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Garage Spaces
									</label>
									<input
										type='number'
										name='garage_spaces'
										value={attributes.garage_spaces}
										onChange={handleAttributeChange}
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Heating Type
									</label>
									<input
										type='text'
										name='heating_type'
										value={attributes.heating_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Central, Radiant'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Cooling Type
									</label>
									<input
										type='text'
										name='cooling_type'
										value={attributes.cooling_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Central AC, Split AC'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Roof Type
									</label>
									<input
										type='text'
										name='roof_type'
										value={attributes.roof_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Shingle, Metal'
									/>
								</div>
								<div className='flex items-center'>
									<input
										type='checkbox'
										name='basement'
										checked={attributes.basement}
										onChange={handleAttributeChange}
										className='w-4 h-4 text-blue-600 border-gray-300 rounded'
									/>
									<label className='ml-2 text-sm text-gray-700'>
										Has Basement
									</label>
								</div>
							</div>
						)}

						{/* Apartment Attributes */}
						{formData.property_type === 'apartment' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Bedrooms
									</label>
									<input
										type='number'
										name='bedrooms'
										value={attributes.bedrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Bathrooms
									</label>
									<input
										type='number'
										name='bathrooms'
										value={attributes.bathrooms}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.5'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Area (sq ft)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Floor
									</label>
									<input
										type='number'
										name='floor'
										value={attributes.floor}
										onChange={handleAttributeChange}
										required
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Total Floors
									</label>
									<input
										type='number'
										name='total_floors'
										value={attributes.total_floors}
										onChange={handleAttributeChange}
										required
										min='1'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Unit Number
									</label>
									<input
										type='text'
										name='unit_number'
										value={attributes.unit_number}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Building Name
									</label>
									<input
										type='text'
										name='building_name'
										value={attributes.building_name}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Year Built
									</label>
									<input
										type='number'
										name='year_built'
										value={attributes.year_built}
										onChange={handleAttributeChange}
										min='1800'
										max={new Date().getFullYear()}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Parking Spaces
									</label>
									<input
										type='number'
										name='parking_spaces'
										value={attributes.parking_spaces}
										onChange={handleAttributeChange}
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div className='md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4'>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='balcony'
											checked={attributes.balcony}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Balcony
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='elevator'
											checked={attributes.elevator}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Elevator
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='security_system'
											checked={attributes.security_system}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Security System
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='pet_friendly'
											checked={attributes.pet_friendly}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Pet Friendly
										</label>
									</div>
								</div>
							</div>
						)}

						{/* Commercial Attributes */}
						{formData.property_type === 'commercial' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Business Type
									</label>
									<input
										type='text'
										name='business_type'
										value={attributes.business_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Office, Retail, Warehouse'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Area (sq ft)
									</label>
									<input
										type='number'
										name='area_sqft'
										value={attributes.area_sqft}
										onChange={handleAttributeChange}
										required
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Floors
									</label>
									<input
										type='number'
										name='floors'
										value={attributes.floors}
										onChange={handleAttributeChange}
										min='1'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Year Built
									</label>
									<input
										type='number'
										name='year_built'
										value={attributes.year_built}
										onChange={handleAttributeChange}
										min='1800'
										max={new Date().getFullYear()}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Parking Spaces
									</label>
									<input
										type='number'
										name='parking_spaces'
										value={attributes.parking_spaces}
										onChange={handleAttributeChange}
										min='0'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Zoning Type
									</label>
									<input
										type='text'
										name='zoning_type'
										value={attributes.zoning_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Commercial, Mixed Use'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Ceiling Height (ft)
									</label>
									<input
										type='number'
										name='ceiling_height'
										value={attributes.ceiling_height}
										onChange={handleAttributeChange}
										min='0'
										step='0.1'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div className='flex items-center'>
									<input
										type='checkbox'
										name='loading_dock'
										checked={attributes.loading_dock}
										onChange={handleAttributeChange}
										className='w-4 h-4 text-blue-600 border-gray-300 rounded'
									/>
									<label className='ml-2 text-sm text-gray-700'>
										Loading Dock
									</label>
								</div>
							</div>
						)}

						{/* Land Attributes */}
						{formData.property_type === 'land' && (
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Area (acres)
									</label>
									<input
										type='number'
										name='area_acres'
										value={attributes.area_acres}
										onChange={handleAttributeChange}
										required
										min='0'
										step='0.01'
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Zoning Type
									</label>
									<input
										type='text'
										name='zoning_type'
										value={attributes.zoning_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Residential, Agricultural'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Topography
									</label>
									<input
										type='text'
										name='topography'
										value={attributes.topography}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Flat, Sloped, Hilly'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Soil Type
									</label>
									<input
										type='text'
										name='soil_type'
										value={attributes.soil_type}
										onChange={handleAttributeChange}
										className='w-full border border-gray-300 rounded-lg px-4 py-2'
										placeholder='e.g., Clay, Sandy, Loam'
									/>
								</div>
								<div className='md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4'>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='road_access'
											checked={attributes.road_access}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Road Access
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='utilities_available'
											checked={attributes.utilities_available}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Utilities Available
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='is_fenced'
											checked={attributes.is_fenced}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>Fenced</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='water_rights'
											checked={attributes.water_rights}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Water Rights
										</label>
									</div>
									<div className='flex items-center'>
										<input
											type='checkbox'
											name='mineral_rights'
											checked={attributes.mineral_rights}
											onChange={handleAttributeChange}
											className='w-4 h-4 text-blue-600 border-gray-300 rounded'
										/>
										<label className='ml-2 text-sm text-gray-700'>
											Mineral Rights
										</label>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Features */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6'>Features & Amenities</h2>
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

					{/* Property Images */}
					<div className='bg-white shadow rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-6 flex items-center'>
							<ImageIcon className='w-5 h-5 mr-2' />
							Property Images
						</h2>

						<div className='mb-6'>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Upload Images
							</label>
							<div className='mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg'>
								<div className='space-y-1 text-center'>
									<Upload className='mx-auto h-12 w-12 text-gray-400' />
									<div className='flex text-sm text-gray-600'>
										<label className='relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500'>
											<span>Upload files</span>
											<input
												type='file'
												className='sr-only'
												multiple
												accept='image/*'
												onChange={handleImageChange}
											/>
										</label>
										<p className='pl-1'>or drag and drop</p>
									</div>
									<p className='text-xs text-gray-500'>
										PNG, JPG, GIF up to 10MB
									</p>
								</div>
							</div>
						</div>

						{imagePreviews.length > 0 && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Uploaded Images
								</label>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									{imagePreviews.map((preview, index) => (
										<div key={`image-${index}`} className='relative group'>
											<Image
												src={preview}
												alt={`Property ${index + 1}`}
												width={320}
												height={128}
												className='w-full h-32 object-cover rounded-lg'
											/>
											<div className='absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2'>
												<button
													type='button'
													onClick={() => setPrimaryImageIndex(index)}
													className={`p-2 rounded-full ${
														primaryImageIndex === index
															? 'bg-blue-600 text-white'
															: 'bg-white text-gray-700'
													}`}
													title='Set as primary'
												>
													<ImageIcon className='w-4 h-4' />
												</button>
												<button
													type='button'
													onClick={() => removeImage(index)}
													className='p-2 bg-red-600 text-white rounded-full'
													title='Remove image'
												>
													<X className='w-4 h-4' />
												</button>
											</div>
											{primaryImageIndex === index && (
												<div className='absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded'>
													Primary
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Submit Button */}
					<div className='flex justify-end space-x-4'>
						<button
							type='button'
							onClick={() => router.push('/admin/properties')}
							className='px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={loading}
							className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
						>
							{loading ? (
								<>
									<span className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></span>
									Creating...
								</>
							) : (
								<>
									<Plus className='w-5 h-5 mr-2' />
									Create Property
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</AdminLayout>
	)
}
