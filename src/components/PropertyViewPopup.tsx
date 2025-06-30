// src/components/PropertyViewPopup.tsx - Complete fix with media slider
import React, { useState } from 'react'
import Image from 'next/image'
import {
	X,
	MapPin,
	Calendar,
	Eye,
	User,
	Phone,
	Home,
	Building2,
	Landmark,
	Trees,
	Bed,
	Bath,
	Maximize,
	Building,
	Star,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	Play,
	DollarSign,
	Hash,
	Globe,
	Navigation,
	Copy,
} from 'lucide-react'
import { get } from 'http'

interface PropertyViewPopupProps {
	property: any
	isOpen: boolean
	onClose: () => void
}

const PropertyViewPopup: React.FC<PropertyViewPopupProps> = ({
	property,
	isOpen,
	onClose,
}) => {
	const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

	if (!isOpen || !property) return null

	// Define media type with optional thumbnail_url
	type MediaItem = {
		id: string
		url: any
		type: string
		is_primary: boolean
		thumbnail_url?: string
	}
	const allMedia: MediaItem[] = []

	if (
		property.images &&
		Array.isArray(property.images) &&
		property.images.length > 0
	) {
		// Sort images with primary first
		const sortedImages = [...property.images].sort((a, b) => {
			if (a.is_primary && !b.is_primary) return -1
			if (!a.is_primary && b.is_primary) return 1
			return (a.display_order || 0) - (b.display_order || 0)
		})

		sortedImages.forEach((img: any, index: number) => {
			allMedia.push({
				id: `img-${img.id || index}`, // ✅ FIX: Unique IDs
				url: img.url,
				thumbnail_url: img.thumbnail_url || img.url,
				type: img.type || 'image',
				is_primary: img.is_primary || false,
			})
		})
	} else if (property.primary_image) {
		// Fallback to primary_image only if no images array
		allMedia.push({
			id: 'primary-fallback',
			url: property.primary_image,
			type: 'image',
			is_primary: true,
			thumbnail_url: property.primary_image,
		})
	}

	const nextMedia = () => {
		setCurrentMediaIndex(prev => (prev === allMedia.length - 1 ? 0 : prev + 1))
	}

	const prevMedia = () => {
		setCurrentMediaIndex(prev => (prev === 0 ? allMedia.length - 1 : prev - 1))
	}
	const getAttributeValue = (key: string) => {
		// Check in property.attributes first
		if (property.attributes && property.attributes[key] !== undefined) {
			return property.attributes[key]
		}
		// Check in property root level as fallback
		if (property[key] !== undefined) {
			return property[key]
		}
		return null
	}

	// ✅ FIX: Properly handle features
	const propertyFeatures = property.features || []

	// Property type icons
	const propertyTypeIcons = {
		house: Home,
		apartment: Building2,
		commercial: Landmark,
		land: Trees,
	}

	const propertyTypeDisplay: Record<string, string> = {
		house: 'Առանձնատուն',
		apartment: 'Բնակարան',
		commercial: 'Կոմերցիոն',
		land: 'Հողատարածք',
	}

	// Listing type translations
	const listingTypeDisplay: Record<string, string> = {
		sale: 'Վաճառք',
		rent: 'Վարձակալություն',
		daily_rent: 'Օրյա վարձակալություն',
	}

	// Status translations
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

	// Status color helper
	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'available':
				return 'bg-green-100 text-green-800'
			case 'sold':
				return 'bg-red-100 text-red-800'
			case 'rented':
				return 'bg-blue-100 text-blue-800'
			case 'pending':
				return 'bg-yellow-100 text-yellow-800'
			case 'under_review':
				return 'bg-purple-100 text-purple-800'
			case 'coming_soon':
				return 'bg-indigo-100 text-indigo-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const formatPrice = (price: number, currency: string = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			maximumFractionDigits: 0,
		}).format(price)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('hy-AM', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const getLocationDisplay = () => {
		if (property.location_display) {
			return property.location_display
		}

		const parts = []
		if (property.district_name) {
			parts.push(property.district_name)
		}
		if (property.city_name) {
			parts.push(property.city_name)
		}
		if (property.state_name) {
			parts.push(property.state_name)
		}
		return parts.length > 0 ? parts.join(', ') : 'Տեղեկություն չկա'
	}

	const Icon =
		propertyTypeIcons[
			property.property_type as keyof typeof propertyTypeIcons
		] || Home

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'>
					<div className='flex items-center space-x-4'>
						<div className='p-3 bg-blue-100 rounded-full'>
							<Icon className='w-8 h-8 text-blue-600' />
						</div>
						<div>
							<h2 className='text-2xl font-bold text-gray-900'>
								{property.title}
							</h2>
							<div className='flex items-center space-x-4 text-gray-600'>
								<div className='flex items-center'>
									<MapPin className='w-4 h-4 mr-1' />
									{getLocationDisplay()}
								</div>
								<div className='flex items-center'>
									ID: {property.custom_id || '-'}
								</div>
							</div>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors'
					>
						<X className='w-6 h-6' />
					</button>
				</div>

				{/* Content */}
				<div className='overflow-y-auto max-h-[calc(95vh-140px)]'>
					<div className='p-6 space-y-8'>
						{/* Main Content Grid */}
						<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
							{/* Left Column - Media & Main Details */}
							<div className='lg:col-span-2 space-y-6'>
								<div className='relative h-96 rounded-xl overflow-hidden bg-gray-200'>
									{allMedia.length > 0 ? (
										<>
											{allMedia[currentMediaIndex]?.type === 'video' ? (
												<div className='relative w-full h-full bg-black flex items-center justify-center'>
													<video
														src={allMedia[currentMediaIndex].url}
														controls
														className='max-w-full max-h-full'
													>
														Your browser does not support the video tag.
													</video>
												</div>
											) : (
												<Image
													src={allMedia[currentMediaIndex]?.url}
													alt={property.title}
													fill
													className='object-cover'
												/>
											)}

											{/* Media Navigation */}
											{allMedia.length > 1 && (
												<>
													<button
														onClick={() =>
															setCurrentMediaIndex(prev =>
																prev === 0 ? allMedia.length - 1 : prev - 1
															)
														}
														className='absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all'
													>
														<ChevronLeft className='w-5 h-5' />
													</button>
													<button
														onClick={() =>
															setCurrentMediaIndex(prev =>
																prev === allMedia.length - 1 ? 0 : prev + 1
															)
														}
														className='absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all'
													>
														<ChevronRight className='w-5 h-5' />
													</button>

													{/* Media Counter */}
													<div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm'>
														{currentMediaIndex + 1} / {allMedia.length}
													</div>
												</>
											)}
										</>
									) : (
										<div className='flex items-center justify-center h-full'>
											<Icon className='w-16 h-16 text-gray-400' />
										</div>
									)}
								</div>

								{/* ✅ FIXED: Media Thumbnails for all images */}
								{allMedia.length > 1 && (
									<div className='flex gap-2 overflow-x-auto pb-2'>
										{allMedia.map((media, index) => (
											<button
												key={`media-thumb-${index}`} // ✅ FIX: Use index-based key
												onClick={() => setCurrentMediaIndex(index)}
												className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
													currentMediaIndex === index
														? 'border-blue-500'
														: 'border-transparent hover:border-gray-300'
												}`}
											>
												{media.type === 'video' ? (
													<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
														<Play className='w-6 h-6 text-gray-500' />
													</div>
												) : (
													<Image
														src={media.thumbnail_url || media.url}
														alt={`Media ${index + 1}`}
														fill
														className='object-cover'
													/>
												)}
												{media.is_primary && (
													<div className='absolute top-1 right-1'>
														<Star className='w-3 h-3 text-yellow-500 fill-current' />
													</div>
												)}
											</button>
										))}
									</div>
								)}
								{/* Price & Key Info */}
								<div className='bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6'>
									<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
										<div className='text-center p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-2xl font-bold text-green-600 flex items-center justify-center'>
												<DollarSign className='w-6 h-6 mr-1' />
												{formatPrice(property.price, property.currency)}
											</div>
											<div className='text-sm text-gray-500 mt-1'>Գինը</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-2xl font-bold text-blue-600 flex items-center justify-center'>
												<Eye className='w-5 h-5 mr-1' />
												{property.views || 0}
											</div>
											<div className='text-sm text-gray-500 mt-1'>
												Դիտումներ
											</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-md font-bold text-purple-600'>
												{propertyTypeDisplay[property.property_type]}
											</div>
											<div className='text-sm text-gray-500 mt-1'>Տեսակ</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-md font-bold text-purple-600'>
												{listingTypeDisplay[property.listing_type] || 'Անհայտ'}
											</div>
											<div className='text-sm text-gray-500 mt-1'>
												Հայտարարության տեսակ
											</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-md font-bold text-purple-600'>
												{statusNameDisplay[property.status_name] || 'Անհայտ'}
											</div>
											<div className='text-sm text-gray-500 mt-1'>Վիճակ</div>
										</div>
									</div>
								</div>
								{property.property_type === 'house' && (
									<div className='bg-green-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Տան հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
											{getAttributeValue('bedrooms') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Bed className='w-5 h-5 text-green-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('bedrooms')}
														</div>
														<div className='text-xs text-gray-600'>
															Ննջասենյակ
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('bathrooms') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Bath className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('bathrooms')}
														</div>
														<div className='text-xs text-gray-600'>Լոգարան</div>
													</div>
												</div>
											)}
											{getAttributeValue('area_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Maximize className='w-5 h-5 text-purple-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>քառ. մ</div>
													</div>
												</div>
											)}
											{getAttributeValue('floors') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Building className='w-5 h-5 text-orange-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('floors')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{getAttributeValue('lot_size_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Maximize className='w-5 h-5 text-indigo-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('lot_size_sqft')}
														</div>
														<div className='text-xs text-gray-600'>
															կից տարածք քառ.մ
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('ceiling_height') && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<ArrowUp className='w-5 h-5 text-pink-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('ceiling_height')}մ
														</div>
														<div className='text-xs text-gray-600'>
															Առաստաղի բարձր.
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{/* Apartment Attributes - FIXED */}
								{property.property_type === 'apartment' && (
									<div className='bg-blue-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Բնակարանի հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
											{(property.bedrooms || property.attributes?.bedrooms) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Bed className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('bedrooms')}
														</div>
														<div className='text-xs text-gray-600'>
															Ննջասենյակ
														</div>
													</div>
												</div>
											)}
											{(property.bathrooms ||
												property.attributes?.bathrooms) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Bath className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('bathrooms')}
														</div>
														<div className='text-xs text-gray-600'>Լոգարան</div>
													</div>
												</div>
											)}
											{(property.area_sqft ||
												property.attributes?.area_sqft) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Maximize className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>քառ. մ</div>
													</div>
												</div>
											)}
											{(property.floor || property.attributes?.floor) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Building className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('floor')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{(property.total_floors ||
												property.attributes?.total_floors) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Building className='w-5 h-5 text-blue-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('total_floors')}
														</div>
														<div className='text-xs text-gray-600'>
															Ընդհանուր հարկ
														</div>
													</div>
												</div>
											)}
											{(property.ceiling_height ||
												property.attributes?.ceiling_height) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<ArrowUp className='w-5 h-5 text-indigo-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('ceiling_height')}м
														</div>
														<div className='text-xs text-gray-600'>
															Առաստաղի բարձր.
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{/* Commercial Attributes - FIXED */}
								{property.property_type === 'commercial' && (
									<div className='bg-purple-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Կոմերցիոն հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
											{(property.business_type ||
												property.attributes?.business_type) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Building className='w-5 h-5 text-purple-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('business_type')}
														</div>
														<div className='text-xs text-gray-600'>
															Բիզնեսի տեսակ
														</div>
													</div>
												</div>
											)}
											{(property.area_sqft ||
												property.attributes?.area_sqft) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Maximize className='w-5 h-5 text-purple-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>քառ. մ</div>
													</div>
												</div>
											)}
											{(property.floors || property.attributes?.floors) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<Building className='w-5 h-5 text-purple-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('floors')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{(property.ceiling_height ||
												property.attributes?.ceiling_height) && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg'>
													<ArrowUp className='w-5 h-5 text-indigo-600' />
													<div>
														<div className='font-semibold'>
															{getAttributeValue('ceiling_height')}м
														</div>
														<div className='text-xs text-gray-600'>
															Առաստաղի բարձր.
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{/* Land Attributes - FIXED */}
								{property.property_type === 'land' &&
									(property.area_acres || property.attributes?.area_acres) && (
										<div className='bg-yellow-50 rounded-xl p-6'>
											<h3 className='text-lg font-semibold mb-4 text-gray-900'>
												Հողակտորի մակերես
											</h3>
											<div className='flex items-center space-x-2 bg-white p-4 rounded-lg inline-flex'>
												<Maximize className='w-6 h-6 text-yellow-600' />
												<div>
													<div className='text-xl font-semibold'>
														{getAttributeValue('area_acres')}
													</div>
													<div className='text-sm text-gray-600'>
														քառակուսի մետր
													</div>
												</div>
											</div>
										</div>
									)}
								{/* Features Section - FIXED */}
								{((property.features && property.features.length > 0) ||
									(Array.isArray(property.selectedFeatures) &&
										property.selectedFeatures.length > 0)) && (
									<div className='bg-teal-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Հատկանիշներ և հարմարություններ
										</h3>
										<div className='space-y-2'>
											{/* ✅ FIX: Handle both features array and selectedFeatures */}
											{propertyFeatures && propertyFeatures.length > 0 && (
												<div className='bg-teal-50 rounded-xl p-6'>
													<h3 className='text-lg font-semibold mb-4 text-gray-900'>
														Հատկանիշներ և հարմարություններ
													</h3>
													<div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
														{propertyFeatures.map((feature: any) => (
															<div
																key={feature.id}
																className='flex items-center space-x-2 bg-white p-2 rounded-lg'
															>
																{feature.icon && (
																	<span className='text-lg'>
																		{feature.icon}
																	</span>
																)}
																<span className='text-sm font-medium text-gray-700'>
																	{feature.name}
																</span>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{/* Description */}
								{property.description && (
									<div className='bg-gray-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Նկարագրություն
										</h3>
										<p className='text-gray-700 leading-relaxed whitespace-pre-line'>
											{property.description}
										</p>
									</div>
								)}
								{/* Location Details */}
								<div className='bg-indigo-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900 flex items-center'>
										<Navigation className='w-5 h-5 mr-2' />
										Գտնվելու վայրի մանրամասներ
									</h3>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{property.address && (
											<div className='bg-white p-4 rounded-lg'>
												<div className='text-sm text-gray-700'>
													Ամբողջական հասցե
												</div>
												<div className='font-medium text-gray-600'>
													{property.address}
												</div>
											</div>
										)}
										<div className='bg-white p-4 rounded-lg'>
											<div className='text-sm text-gray-700'>Մարզ/Նահանգ</div>
											<div className='font-medium text-gray-600'>
												{property.state_name || 'Նշված չէ'}
											</div>
										</div>
										<div className='bg-white p-4 rounded-lg'>
											<div className='text-sm text-gray-700'>Քաղաք</div>
											<div className='font-medium text-gray-600'>
												{property.city_name || 'Նշված չէ'}
											</div>
										</div>
										{property.district_name && (
											<div className='bg-white p-4 rounded-lg'>
												<div className='text-sm text-gray-700'>Թաղամաս</div>
												<div className='font-medium text-gray-600'>
													{property.district_name}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Right Column - Owner & Additional Info */}
							<div className='space-y-6'>
								{/* Owner Information */}
								<div className='bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900 flex items-center'>
										<User className='w-5 h-5 mr-2 text-red-600' />
										Սեփականատիրոջ տվյալներ
									</h3>
									<div className='space-y-4'>
										<div className='flex items-center space-x-3 bg-white p-3 rounded-lg'>
											<User className='w-5 h-5 text-gray-700' />
											<div>
												<div className='text-sm text-gray-700'>Անուն</div>
												<div className='font-medium text-gray-600'>
													{property.owner_name || 'Տեղեկություն չկա'}
												</div>
											</div>
										</div>
										<div className='flex items-center space-x-3 bg-white p-3 rounded-lg'>
											<Phone className='w-5 h-5 text-gray-700' />
											<div>
												<div className='text-sm text-gray-700'>Հեռախոս</div>
												<div className='font-medium text-gray-600'>
													{property.owner_phone || 'Տեղեկություն չկա'}
												</div>
											</div>
										</div>
									</div>
								</div>
								{(property.has_viber ||
									property.has_whatsapp ||
									property.has_telegram) && (
									<div className='bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900 flex items-center'>
											<Phone className='w-5 h-5 mr-2 text-green-600' />
											Հասանելի կապի եղանակներ
										</h3>
										<div className='flex flex-wrap gap-3'>
											{property.has_viber && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg border border-purple-200'>
													<div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
														V
													</div>
													<div>
														<div className='font-medium text-gray-900'>
															Viber
														</div>
														<div className='text-sm text-gray-600'>
															Հասանելի է
														</div>
													</div>
												</div>
											)}
											{property.has_whatsapp && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg border border-green-200'>
													<div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
														W
													</div>
													<div>
														<div className='font-medium text-gray-900'>
															WhatsApp
														</div>
														<div className='text-sm text-gray-600'>
															Հասանելի է
														</div>
													</div>
												</div>
											)}
											{property.has_telegram && (
												<div className='flex items-center space-x-2 bg-white p-3 rounded-lg border border-blue-200'>
													<div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
														T
													</div>
													<div>
														<div className='font-medium text-gray-900'>
															Telegram
														</div>
														<div className='text-sm text-gray-600'>
															Հասանելի է
														</div>
													</div>
												</div>
											)}
										</div>
										<div className='mt-3 p-2 bg-blue-50 rounded-lg'>
											<p className='text-sm text-blue-800'>
												💬 Կապվեք սեփականատիրոջ հետ նշված հեռախոսահամարով՝
												օգտագործելով այս հավելվածները
											</p>
										</div>
									</div>
								)}
								{/* Property Meta Info */}
								<div className='bg-gray-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900'>
										Լրացուցիչ տեղեկություններ
									</h3>
									<div className='space-y-3'>
										<div className='bg-white p-3 rounded-lg'>
											<div className='text-sm text-gray-700'>
												Ստեղծման ամսաթիվ
											</div>
											<div className='font-medium flex items-center text-gray-600'>
												<Calendar className='w-4 h-4 mr-1' />
												{formatDate(property.created_at)}
											</div>
										</div>
										{property.updated_at &&
											property.updated_at !== property.created_at && (
												<div className='bg-white p-3 rounded-lg'>
													<div className='text-sm text-gray-700'>
														Վերջին փոփոխություն
													</div>
													<div className='font-medium flex items-center text-gray-600'>
														<Calendar className='w-4 h-4 mr-1' />
														{formatDate(property.updated_at)}
													</div>
												</div>
											)}
										{property.user_email && (
											<div className='bg-white p-3 rounded-lg'>
												<div className='text-sm text-gray-700'>Ստեղծող</div>
												<div className='font-medium text-gray-600'>
													{property.user_email}
												</div>
											</div>
										)}
									</div>
								</div>
								{/* Featured Badge - continued */}
								{property.featured && (
									<div className='bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 text-white text-center'>
										<Star className='w-6 h-6 mx-auto mb-2' />
										<div className='font-semibold'>
											Առաջարկվող հայտարարություն
										</div>
									</div>
								)}
								{/* Features */}
								{property.features && property.features.length > 0 && (
									<div className='bg-teal-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Հատկանիշներ և հարմարություններ
										</h3>
										<div className='space-y-2'>
											{property.features.map((feature: any) => (
												<div
													key={feature.id}
													className='flex items-center space-x-2 bg-white p-2 rounded-lg'
												>
													{feature.icon && (
														<span className='text-lg'>{feature.icon}</span>
													)}
													<span className='text-sm font-medium text-gray-700'>
														{feature.name}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
								{/* Quick Actions */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900'>
										Արագ գործողություններ
									</h3>
									<div className='space-y-3'>
										<button
											onClick={() =>
												window.open(
													`/properties/${property.custom_id}`,
													'_blank'
												)
											}
											className='w-full bg-blue-600 cursor-pointer text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center'
										>
											<Globe className='w-4 h-4 mr-2' />
											Բացել կայքում
										</button>
										<button
											onClick={() => {
												const url = `${window.location.origin}/properties/${property.custom_id}`
												navigator.clipboard.writeText(url)
												alert('Հղումը պատճենվել է!')
											}}
											className='w-full bg-gray-600 text-white px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-center'
										>
											<Copy className='w-4 h-4 mr-2' />
											Պատճենել հղումը
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PropertyViewPopup