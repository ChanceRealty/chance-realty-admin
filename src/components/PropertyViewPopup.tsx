import React, { useState, useEffect } from 'react'
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
	Globe,
	Navigation,
	Copy,
	MessageCircle,
	EyeOff,
	Crown,
} from 'lucide-react'

import { FaWhatsapp } from 'react-icons/fa'
import { FaViber } from 'react-icons/fa'
import { FaTelegram } from 'react-icons/fa'

interface PropertyViewPopupProps {
	property: any
	isOpen: boolean
	onClose: () => void
}

export default function PropertyViewPopup({
	property,
	isOpen,
	onClose,
}: PropertyViewPopupProps) {
	const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
	const [copySuccess, setCopySuccess] = useState(false)

	useEffect(() => {
		setCurrentMediaIndex(0)
		setCopySuccess(false)
	}, [property?.id])

	const allMedia = React.useMemo(() => {
		if (!property) return [] 

		const media: any[] = []

		if (property.images && Array.isArray(property.images)) {
			console.log('📸 Found images array:', property.images.length)
			property.images.forEach((img: any, index: number) => {
				media.push({
					id: `img-${img.id || index}`,
					url: img.url,
					thumbnail_url: img.thumbnail_url || img.url,
					type: img.type || 'image',
					is_primary: img.is_primary || false,
					display_order: img.display_order ?? index,
				})
			})
		}

		if (property.videos && Array.isArray(property.videos)) {
			console.log('🎥 Found videos array:', property.videos.length)
			property.videos.forEach((video: any, index: number) => {
				media.push({
					id: `video-${video.id || index}`,
					url: video.url,
					thumbnail_url: video.thumbnail_url || video.url,
					type: 'video',
					is_primary: false,
					display_order: video.display_order ?? media.length + index,
				})
			})
		}

		if (property.media && Array.isArray(property.media)) {
			console.log('🎬 Found general media array:', property.media.length)
			property.media.forEach((item: any, index: number) => {
				media.push({
					id: `media-${item.id || index}`,
					url: item.url,
					thumbnail_url: item.thumbnail_url || item.url,
					type: item.type || 'image',
					is_primary: item.is_primary || false,
					display_order: item.display_order ?? index,
				})
			})
		}

		if (media.length === 0 && property.primary_image) {
			console.log('📷 Using fallback primary_image')
			media.push({
				id: 'primary-fallback',
				url: property.primary_image,
				type: 'image',
				is_primary: true,
				thumbnail_url: property.primary_image,
				display_order: 0,
			})
		}

		media.sort((a, b) => {
			if (a.is_primary && !b.is_primary) return -1
			if (!a.is_primary && b.is_primary) return 1
			return (a.display_order || 0) - (b.display_order || 0)
		})

		console.log('🎬 Total media items processed:', media.length)
		return media
	}, [
		property?.images,
		property?.videos,
		property?.media,
		property?.primary_image,
	])

	const propertyFeatures = React.useMemo(() => {
		if (!property) return []

		console.log('🏷️ Features processing:', {
			features_field: property.features,
			features_type: typeof property.features,
			features_is_array: Array.isArray(property.features),
		})

		if (Array.isArray(property.features)) {
			return property.features
		}

		if (property.features === null || property.features === undefined) {
			return []
		}

		if (typeof property.features === 'string') {
			try {
				const parsed = JSON.parse(property.features)
				return Array.isArray(parsed) ? parsed : []
			} catch (e) {
				console.warn('Failed to parse features JSON:', e)
				return []
			}
		}

		return []
	}, [property?.features])


	const getAttributeValue = (key: string) => {
		console.log(`🔍 getAttributeValue("${key}")`)

		if (property?.attributes && typeof property.attributes === 'object') {
			const value = property.attributes[key]
			if (value !== undefined && value !== null) {
				console.log(`  ✅ Found ${key} in attributes:`, value)
				return value
			}
		}

		const directValue = property?.[key]
		if (directValue !== undefined && directValue !== null) {
			console.log(`  ✅ Found ${key} in property root:`, directValue)
			return directValue
		}

		console.log(`  ❌ Could not find attribute: ${key}`)
		return null
	}

	const hasSocialMedia = React.useMemo(() => {
		if (!property) return false

		const viber = Boolean(property.has_viber)
		const whatsapp = Boolean(property.has_whatsapp)
		const telegram = Boolean(property.has_telegram)

		return viber || whatsapp || telegram
	}, [property?.has_viber, property?.has_whatsapp, property?.has_telegram])

	if (!isOpen || !property) return null

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

	const listingTypeDisplay: Record<string, string> = {
		sale: 'Վաճառք',
		rent: 'Վարձակալություն',
		daily_rent: 'Օրյա վարձակալություն',
	}

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

	const nextMedia = () => {
		setCurrentMediaIndex(prev => (prev === allMedia.length - 1 ? 0 : prev + 1))
	}

	const prevMedia = () => {
		setCurrentMediaIndex(prev => (prev === 0 ? allMedia.length - 1 : prev - 1))
	}

	const handleCopyLink = () => {
		const url = `https://chancerealty.am/properties/${property.custom_id}`
		navigator.clipboard.writeText(url)
		setCopySuccess(true)
		setTimeout(() => setCopySuccess(false), 2000)
	}


	return (
		<div
			className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50'
			onClick={e => {
				if (e.target === e.currentTarget) {
					onClose()
				}
			}}
		>
			<div className='bg-white rounded-lg sm:rounded-2xl w-full max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl'>
				{/* ✅ MOBILE-RESPONSIVE Header */}
				<div className='flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'>
					<div className='flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0'>
						<div className='p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0'>
							<Icon className='w-5 h-5 sm:w-8 sm:h-8 text-blue-600' />
						</div>

						<div className='min-w-0 flex-1'>
							<h2 className='text-lg sm:text-2xl font-bold text-gray-900 truncate'>
								{property.title}
							</h2>
							<div className='flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-600 text-sm'>
								<div className='flex items-center truncate'>
									<MapPin className='w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0' />
									<span className='truncate'>{getLocationDisplay()}</span>
								</div>
								<div className='flex items-center mt-1 sm:mt-0'>
									<span className='text-lg font-bold'>
										ID: {property.custom_id || '-'}
									</span>
								</div>
							</div>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors flex-shrink-0 ml-2'
					>
						<X className='w-5 h-5 sm:w-6 sm:h-6' />
					</button>
				</div>

				{/* ✅ MOBILE-RESPONSIVE Content */}
				<div className='overflow-y-auto max-h-[calc(98vh-80px)] sm:max-h-[calc(95vh-140px)]'>
					<div className='p-3 sm:p-6 space-y-4 sm:space-y-8'>
						{/* ✅ MOBILE-RESPONSIVE Grid Layout */}
						<div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8'>
							{/* Left Column - Media & Main Details */}
							<div className='lg:col-span-2 space-y-4 sm:space-y-6'>
								{/* ✅ MOBILE-RESPONSIVE Media Gallery */}
								<div className='relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg sm:rounded-xl overflow-hidden bg-gray-200'>
									{allMedia.length > 0 ? (
										<>
											{allMedia[currentMediaIndex]?.type === 'video' ? (
												<div className='relative w-full h-full bg-black flex items-center justify-center'>
													<video
														src={allMedia[currentMediaIndex].url}
														poster={allMedia[currentMediaIndex].thumbnail_url}
														controls
														className='max-w-full max-h-full'
														preload='metadata'
													>
														Your browser does not support the video tag.
													</video>
												</div>
											) : (
												<Image
													src={allMedia[currentMediaIndex]?.url || ''}
													alt={property.title}
													fill
													className='object-cover'
													unoptimized
												/>
											)}

											{/* Media Navigation */}
											{allMedia.length > 1 && (
												<>
													<button
														onClick={prevMedia}
														className='absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all'
													>
														<ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
													</button>
													<button
														onClick={nextMedia}
														className='absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all'
													>
														<ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
													</button>

													{/* Media Counter */}
													<div className='absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm'>
														{currentMediaIndex + 1} / {allMedia.length}
													</div>
												</>
											)}
										</>
									) : (
										<div className='flex items-center justify-center h-full'>
											<Icon className='w-12 h-12 sm:w-16 sm:h-16 text-gray-400' />
										</div>
									)}
								</div>

								{/* ✅ MOBILE-RESPONSIVE Media Thumbnails */}
								{allMedia.length > 1 && (
									<div className='flex gap-1 sm:gap-2 overflow-x-auto pb-2'>
										{allMedia.map((media, index) => (
											<button
												key={`media-thumb-${media.id}-${index}`}
												onClick={() => setCurrentMediaIndex(index)}
												className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all ${
													currentMediaIndex === index
														? 'border-blue-500'
														: 'border-transparent hover:border-gray-300'
												}`}
											>
												{media.type === 'video' ? (
													<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
														<Play className='w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-gray-500' />
													</div>
												) : (
													<Image
														src={media.thumbnail_url || media.url}
														alt={`Media ${index + 1}`}
														fill
														className='object-cover'
														unoptimized
													/>
												)}
												{media.is_primary && (
													<div className='absolute top-0.5 right-0.5 sm:top-1 sm:right-1'>
														<Star className='w-2 h-2 sm:w-3 sm:h-3 text-yellow-500 fill-current' />
													</div>
												)}
											</button>
										))}
									</div>
								)}

								{/* ✅ MOBILE-RESPONSIVE Price & Key Info */}
								{/* <div className='bg-gradient-to-r from-green-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6'>
									<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4'>
										<div className='col-span-2 sm:col-span-1 text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-lg sm:text-2xl font-bold text-green-600 flex items-center justify-center'>
												<DollarSign className='w-4 h-4 sm:w-6 sm:h-6 mr-1' />
												<span className='truncate'>
													{formatPrice(property.price, property.currency)}
												</span>
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Գինը
											</div>
										</div>
										<div className='text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-lg sm:text-2xl font-bold text-blue-600 flex items-center justify-center'>
												<Eye className='w-4 h-4 sm:w-5 sm:h-5 mr-1' />
												{property.views || 0}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Դիտումներ
											</div>
										</div>
										<div className='text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-purple-600 truncate'>
												{propertyTypeDisplay[property.property_type]}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Տեսակ
											</div>
										</div>
										<div className='text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-purple-600 truncate'>
												{listingTypeDisplay[property.listing_type] || 'Անհայտ'}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Հայտարարության տեսակ
											</div>
										</div>
										<div className='text-center p-2 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-purple-600 truncate'>
												{statusNameDisplay[
													property.status_name || property.status
												] || 'Անհայտ'}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Վիճակ
											</div>
										</div>
									</div>
								</div> */}
								{(property.owner_name ||
									property.owner_phone ||
									property.address_admin) && (
									<div className='bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-red-200'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center'>
											<User className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600' />
											Սեփականատիրոջ տվյալներ
										</h3>
										<div className='space-y-3 sm:space-y-4'>
											<div className='flex items-center space-x-3 bg-white p-3 rounded-lg'>
												<User className='w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0' />
												<div className='min-w-0 flex-1'>
													<div className='text-xs sm:text-sm text-gray-700'>
														Անուն
													</div>
													<div className='font-medium text-gray-600 text-sm sm:text-base truncate'>
														{property.owner_name || 'Տեղեկություն չկա'}
													</div>
												</div>
											</div>
											<div className='flex items-center space-x-3 bg-white p-3 rounded-lg'>
												<Phone className='w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0' />
												<div className='min-w-0 flex-1'>
													<div className='text-xs sm:text-sm text-gray-700'>
														Հեռախոս
													</div>
													<div className='font-medium text-gray-600 text-sm sm:text-base'>
														{property.owner_phone || 'Տեղեկություն չկա'}
													</div>
												</div>
											</div>
											<div className='flex items-center space-x-3 bg-white p-3 rounded-lg'>
												<MapPin className='w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0' />
												<div className='min-w-0 flex-1'>
													<div className='text-xs sm:text-sm text-gray-700'>
														Հասցե (Ադմինիսատրատորի համար)
													</div>
													<div className='font-medium text-gray-600 text-sm sm:text-base'>
														{property.address_admin || 'Տեղեկություն չկա'}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
								{/* ✅ MOBILE-RESPONSIVE Social Media Communication Methods */}
								{hasSocialMedia && (
									<div className='bg-gradient-to-br from-green-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-green-200'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center'>
											<MessageCircle className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600' />
											Հասանելի կապի եղանակներ
										</h3>
										<div className='flex flex-row flex-wrap gap-2 sm:gap-3'>
											{property.has_viber && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg border border-purple-200'>
													<FaViber color='purple' size={25} />
												</div>
											)}
											{property.has_whatsapp && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg border border-green-200'>
													<FaWhatsapp color='green' size={25} />
												</div>
											)}
											{property.has_telegram && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg border border-blue-200'>
													<FaTelegram color='blue' size={25} />
												</div>
											)}
										</div>
									</div>
								)}
								{/* ✅ MOBILE-RESPONSIVE Visibility Status & Controls */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-indigo-200'>
									<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center'>
										<Eye className='w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600' />
										Տեսանելիության կարգավիճակ
									</h3>

									<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
										{/* Hidden Status */}
										<div className='bg-white p-3 sm:p-4 rounded-lg border'>
											<div className='flex items-center justify-between mb-2'>
												<div className='flex items-center'>
													{property.is_hidden ? (
														<EyeOff className='w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2' />
													) : (
														<Eye className='w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2' />
													)}
													<span className='text-sm sm:text-base font-medium text-gray-900'>
														{property.is_hidden ? 'Թաքնված' : 'Հանրային'}
													</span>
												</div>
											</div>
											<p className='text-xs sm:text-sm text-gray-600'>
												{property.is_hidden
													? 'Այս հայտարարությունը թաքնված է հանրային ցուցակից'
													: 'Այս հայտարարությունը տեսանելի է հանրային ցուցակում'}
											</p>
										</div>

										{/* Exclusive Status */}
										<div className='bg-white p-3 sm:p-4 rounded-lg border'>
											<div className='flex items-center justify-between mb-2'>
												<div className='flex items-center'>
													<Crown
														className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${
															property.is_exclusive
																? 'text-purple-500'
																: 'text-gray-400'
														}`}
													/>
													<span className='text-sm sm:text-base font-medium text-gray-900'>
														{property.is_exclusive
															? 'Էքսկլյուզիվ'
															: 'Սովորական'}
													</span>
												</div>
											</div>
											<p className='text-xs sm:text-sm text-gray-600'>
												{property.is_exclusive
													? 'Այս հայտարարությունը նշված է որպես էքսկլյուզիվ'
													: 'Սա սովորական հայտարարություն է'}
											</p>
										</div>
									</div>
								</div>

								{/* ✅ MOBILE-RESPONSIVE Apartment Attributes */}
								{property.property_type === 'apartment' && (
									<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 border rounded-lg sm:rounded-xl p-3 sm:p-6'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
											Բնակարանի հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4'>
											{getAttributeValue('bedrooms') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Bed className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('bedrooms')}
														</div>
														<div className='text-xs text-gray-600 truncate'>
															Ննջասենյակ
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('bathrooms') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Bath className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('bathrooms')}
														</div>
														<div className='text-xs text-gray-600'>Լոգարան</div>
													</div>
												</div>
											)}
											{getAttributeValue('area_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Maximize className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>
															Մակերես (մ²)
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('floor') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Building className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('floor')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{getAttributeValue('total_floors') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Building className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('total_floors')}
														</div>
														<div className='text-xs text-gray-600'>Ընդհանուր հարկեր</div>
													</div>
												</div>
											)}
											{getAttributeValue('ceiling_height') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<ArrowUp className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
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

								{/* ✅ MOBILE-RESPONSIVE House Attributes */}
								{property.property_type === 'house' && (
									<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 border rounded-lg sm:rounded-xl p-3 sm:p-6'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
											Տան հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4'>
											{getAttributeValue('bedrooms') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Bed className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('bedrooms')}
														</div>
														<div className='text-xs text-gray-600 truncate'>
															Ննջասենյակ
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('bathrooms') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Bath className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('bathrooms')}
														</div>
														<div className='text-xs text-gray-600'>Լոգարան</div>
													</div>
												</div>
											)}
											{getAttributeValue('area_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Maximize className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>
															Մակերես (մ²)
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('floors') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Building className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('floors')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{getAttributeValue('lot_size_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Maximize className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('lot_size_sqft')}
														</div>
														<div className='text-xs text-gray-600'>
															Հողատարածքի մակերես (մ²)
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('ceiling_height') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<ArrowUp className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
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

								{/* ✅ MOBILE-RESPONSIVE Commercial Attributes */}
								{property.property_type === 'commercial' && (
									<div className='bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-6'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
											Կոմերցիոն հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4'>
											{getAttributeValue('business_type') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Building className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('business_type')}
														</div>
														<div className='text-xs text-gray-600'>
															Բիզնեսի տեսակ
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('area_sqft') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Maximize className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('area_sqft')}
														</div>
														<div className='text-xs text-gray-600'>
															Մակերես (մ²)
														</div>
													</div>
												</div>
											)}
											{getAttributeValue('floors') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<Building className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
															{getAttributeValue('floors')}
														</div>
														<div className='text-xs text-gray-600'>Հարկ</div>
													</div>
												</div>
											)}
											{getAttributeValue('ceiling_height') && (
												<div className='flex items-center space-x-2 bg-white p-2 sm:p-3 rounded-lg'>
													<ArrowUp className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
													<div className='min-w-0'>
														<div className='font-semibold text-sm sm:text-base text-gray-600'>
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

								{/* ✅ MOBILE-RESPONSIVE Land Attributes */}
								{property.property_type === 'land' &&
									getAttributeValue('area_acres') && (
										<div className='bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-6'>
											<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
												Հողակտորի մակերես
											</h3>
											<div className='flex items-center space-x-2 bg-white p-3 sm:p-4 rounded-lg inline-flex'>
												<Maximize className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
												<div>
													<div className='text-lg sm:text-xl font-semibold text-gray-600'>
														{getAttributeValue('area_acres')}
													</div>
													<div className='text-xs sm:text-sm text-gray-600'>
														Հողատարածքի մակերես (մ²)
													</div>
												</div>
											</div>
										</div>
									)}

								{/* ✅ MOBILE-RESPONSIVE Features Section */}
								{propertyFeatures.length > 0 && (
									<div className='bg-teal-50 rounded-lg sm:rounded-xl p-3 sm:p-6'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
											Հատկանիշներ և հարմարություններ
										</h3>
										<div className='grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2'>
											{propertyFeatures.map((feature: any, index: number) => (
												<div
													key={feature.id || index}
													className='flex items-center space-x-2 bg-white p-2 rounded-lg'
												>
													{feature.icon && (
														<span className='text-base sm:text-lg flex-shrink-0'>
															{feature.icon}
														</span>
													)}
													<span className='text-xs sm:text-sm font-medium text-gray-700 truncate'>
														{feature.name}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								{/* ✅ MOBILE-RESPONSIVE Description */}
								{property.description && (
									<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-6'>
										<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
											Նկարագրություն
										</h3>
										<p className='text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line'>
											{property.description}
										</p>
									</div>
								)}

								{/* ✅ MOBILE-RESPONSIVE Location Details */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-6'>
									<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center'>
										<Navigation className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
										Գտնվելու վայրի մանրամասներ
									</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4'>
										{property.address && (
											<div className='bg-white p-3 sm:p-4 rounded-lg'>
												<div className='text-xs sm:text-sm text-gray-700'>
													Ամբողջական հասցե
												</div>
												<div className='font-medium text-gray-600 text-sm sm:text-base break-words'>
													{property.address}
												</div>
											</div>
										)}
										<div className='bg-white p-3 sm:p-4 rounded-lg'>
											<div className='text-xs sm:text-sm text-gray-700'>
												Մարզ/Նահանգ
											</div>
											<div className='font-medium text-gray-600 text-sm sm:text-base'>
												{property.state_name || 'Նշված չէ'}
											</div>
										</div>
										<div className='bg-white p-3 sm:p-4 rounded-lg'>
											<div className='text-xs sm:text-sm text-gray-700'>
												Քաղաք
											</div>
											<div className='font-medium text-gray-600 text-sm sm:text-base'>
												{property.city_name || 'Նշված չէ'}
											</div>
										</div>
										{property.district_name && (
											<div className='bg-white p-3 sm:p-4 rounded-lg'>
												<div className='text-xs sm:text-sm text-gray-700'>
													Թաղամաս
												</div>
												<div className='font-medium text-gray-600 text-sm sm:text-base'>
													{property.district_name}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* ✅ MOBILE-RESPONSIVE Right Column - Owner & Additional Info */}
							<div className='space-y-4 sm:space-y-6'>
								{/* ✅ MOBILE-RESPONSIVE Owner Information */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 border rounded-lg sm:rounded-xl p-3 sm:p-6'>
									<div className='flex flex-col gap-3 sm:gap-4'>
										<div className='text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-lg sm:text-2xl font-bold text-blue-600 flex items-center justify-center'>
												<span className='truncate'>
													{formatPrice(property.price, property.currency)}
												</span>
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Գինը
											</div>
										</div>

										<div className='text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-lg sm:text-2xl font-bold text-blue-600 flex items-center justify-center'>
												<Eye className='w-4 h-4 sm:w-5 sm:h-5 mr-1' />
												{property.views || 0}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Դիտումներ
											</div>
										</div>

										<div className='text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-blue-600 truncate'>
												{propertyTypeDisplay[property.property_type]}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Տեսակ
											</div>
										</div>

										<div className='text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-blue-600 truncate'>
												{listingTypeDisplay[property.listing_type] || 'Անհայտ'}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Հայտարարության տեսակ
											</div>
										</div>

										<div className='text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm'>
											<div className='text-xs sm:text-md font-bold text-blue-600 truncate'>
												{statusNameDisplay[
													property.status_name || property.status
												] || 'Անհայտ'}
											</div>
											<div className='text-xs sm:text-sm text-gray-500 mt-1'>
												Վիճակ
											</div>
										</div>
									</div>
								</div>

								{/* ✅ MOBILE-RESPONSIVE Property Meta Info */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-6'>
									<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
										Լրացուցիչ տեղեկություններ
									</h3>
									<div className='space-y-2 sm:space-y-3'>
										<div className='bg-white p-3 rounded-lg'>
											<div className='text-xs sm:text-sm text-gray-700'>
												Ստեղծման ամսաթիվ
											</div>
											<div className='font-medium flex items-center text-gray-600 text-sm sm:text-base'>
												<Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
												{formatDate(property.created_at)}
											</div>
										</div>
										{property.updated_at &&
											property.updated_at !== property.created_at && (
												<div className='bg-white p-3 rounded-lg'>
													<div className='text-xs sm:text-sm text-gray-700'>
														Վերջին փոփոխություն
													</div>
													<div className='font-medium flex items-center text-gray-600 text-sm sm:text-base'>
														<Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
														{formatDate(property.updated_at)}
													</div>
												</div>
											)}
										{property.user_email && (
											<div className='bg-white p-3 rounded-lg'>
												<div className='text-xs sm:text-sm text-gray-700'>
													Ստեղծող
												</div>
												<div className='font-medium text-gray-600 text-sm sm:text-base break-all'>
													{property.user_email}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* ✅ MOBILE-RESPONSIVE Featured Badge */}
								{property.featured && (
									<div className='bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white text-center'>
										<Star className='w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2' />
										<div className='font-semibold text-sm sm:text-base'>
											Առաջարկվող հայտարարություն
										</div>
									</div>
								)}

								{/* ✅ MOBILE-RESPONSIVE Quick Actions */}
								<div className='bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-6'>
									<h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900'>
										Արագ գործողություններ
									</h3>
									<div className='space-y-2 sm:space-y-3'>
										<button
											onClick={() =>
												window.open(
													`https://chancerealty.am/properties/${property.custom_id}`,
													'_blank'
												)
											}
											className='w-full bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base'
										>
											<Globe className='w-4 h-4 mr-2' />
											Բացել կայքում
										</button>
										<button
											onClick={handleCopyLink}
											className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base ${
												copySuccess
													? 'bg-green-600 text-white'
													: 'bg-gray-600 text-white hover:bg-gray-700'
											}`}
										>
											<Copy className='w-4 h-4 mr-2' />
											{copySuccess ? 'Պատճենվել է!' : 'Պատճենել հղումը'}
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
