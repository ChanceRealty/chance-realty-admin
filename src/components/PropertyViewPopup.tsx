import React from 'react'
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
} from 'lucide-react'

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
	if (!isOpen || !property) return null

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
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const formatPrice = (price: number) => {
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
		})
	}

	const Icon =
		propertyTypeIcons[
			property.property_type as keyof typeof propertyTypeIcons
		] || Home

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl'>
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
							<p className='text-gray-600 flex items-center'>
								<MapPin className='w-4 h-4 mr-1' />
								{property.city_name}, {property.state_name}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-full transition-colors'
					>
						<X className='w-6 h-6' />
					</button>
				</div>

				{/* Content */}
				<div className='overflow-y-auto max-h-[calc(90vh-100px)]'>
					<div className='p-6 space-y-8'>
						{/* Main Info Grid */}
						<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
							{/* Left Column - Main Details */}
							<div className='lg:col-span-2 space-y-6'>
								{/* Property Image */}
								<div className='relative h-80 rounded-xl overflow-hidden bg-gray-200'>
									{property.primary_image ? (
										<Image
											src={property.primary_image}
											alt={property.title}
											fill
											className='object-cover'
										/>
									) : (
										<div className='flex items-center justify-center h-full'>
											<Icon className='w-16 h-16 text-gray-400' />
										</div>
									)}
									<div className='absolute top-4 left-4'>
										<span className='bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium'>
											{listingTypeDisplay[property.listing_type] ||
												property.listing_type}
										</span>
									</div>
									<div className='absolute top-4 right-4'>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
												property.status_name
											)}`}
										>
											{property.status_name || 'Չի նշված'}
										</span>
									</div>
								</div>

								{/* Property Details */}
								<div className='bg-gray-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900'>
										Հայտարարության մանրամասները
									</h3>
									<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
										<div className='text-center p-4 bg-white rounded-lg'>
											<div className='text-2xl font-bold text-blue-600'>
												{formatPrice(property.price)}
											</div>
											<div className='text-sm text-gray-500'>Գինը</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg'>
											<div className='text-2xl font-bold text-gray-900'>
												{property.views}
											</div>
											<div className='text-sm text-gray-500 flex items-center justify-center'>
												<Eye className='w-4 h-4 mr-1' />
												Դիտումներ
											</div>
										</div>
										<div className='text-center p-4 bg-white rounded-lg'>
											<div className='text-2xl font-bold text-gray-900'>
												{propertyTypeDisplay[property.property_type]}
											</div>
											<div className='text-sm text-gray-500'>Տեսակ</div>
										</div>
									</div>
								</div>

								{/* Property Attributes */}
								{property.property_type === 'house' && (
									<div className='bg-green-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Տան հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
											<div className='flex items-center space-x-2'>
												<Bed className='w-5 h-5 text-green-600' />
												<div>
													<div className='font-semibold'>Ննջասենյակներ</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												<Bath className='w-5 h-5 text-blue-600' />
												<div>
													<div className='font-semibold'>Լոգարաններ</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												<Maximize className='w-5 h-5 text-purple-600' />
												<div>
													<div className='font-semibold'>Մակերես</div>
													<div className='text-gray-600'>քառ. ֆտ</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												<Building className='w-5 h-5 text-orange-600' />
												<div>
													<div className='font-semibold'>Հարկեր</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{property.property_type === 'apartment' && (
									<div className='bg-blue-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Բնակարանի հատկանիշներ
										</h3>
										<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
											<div className='flex items-center space-x-2'>
												<Bed className='w-5 h-5 text-blue-600' />
												<div>
													<div className='font-semibold'>Ննջասենյակներ</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												<Bath className='w-5 h-5 text-blue-600' />
												<div>
													<div className='font-semibold'>Լոգարաններ</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												<Building className='w-5 h-5 text-blue-600' />
												<div>
													<div className='font-semibold'>Հարկ</div>
													<div className='text-gray-600'>հատ</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{property.description && (
									<div className='bg-gray-50 rounded-xl p-6'>
										<h3 className='text-lg font-semibold mb-4 text-gray-900'>
											Նկարագրություն
										</h3>
										<p className='text-gray-700 leading-relaxed'>
											{property.description}
										</p>
									</div>
								)}
							</div>

							{/* Right Column - Owner & Additional Info */}
							<div className='space-y-6'>
								{/* Owner Information */}
								<div className='bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900 flex items-center'>
										<User className='w-5 h-5 mr-2 text-red-600' />
										Սեփականատիրոջ տվյալներ
									</h3>
									<div className='space-y-3'>
										<div className='flex items-center space-x-3'>
											<User className='w-4 h-4 text-gray-500' />
											<div>
												<div className='text-sm text-gray-500'>Անուն</div>
												<div className='font-medium'>
													{property.owner_name || 'Տեղեկություն չկա'}
												</div>
											</div>
										</div>
										<div className='flex items-center space-x-3'>
											<Phone className='w-4 h-4 text-gray-500' />
											<div>
												<div className='text-sm text-gray-500'>Հեռախոս</div>
												<div className='font-medium'>
													{property.owner_phone || 'Տեղեկություն չկա'}
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Property Meta Info */}
								<div className='bg-gray-50 rounded-xl p-6'>
									<h3 className='text-lg font-semibold mb-4 text-gray-900'>
										Լրացուցիչ տեղեկություններ
									</h3>
									<div className='space-y-3'>
										<div>
											<div className='text-sm text-gray-500'>ID</div>
											<div className='font-medium'>
												{property.custom_id || '-'}
											</div>
										</div>
										<div>
											<div className='text-sm text-gray-500'>
												Ստեղծման ամսաթիվ
											</div>
											<div className='font-medium flex items-center'>
												<Calendar className='w-4 h-4 mr-1' />
												{formatDate(property.created_at)}
											</div>
										</div>
										<div>
											<div className='text-sm text-gray-500'>Հասցե</div>
											<div className='font-medium'>
												{property.address || 'Նշված չէ'}
											</div>
										</div>
										<div>
											<div className='text-sm text-gray-500'>Արժույթ</div>
											<div className='font-medium'>{property.currency}</div>
										</div>
									</div>
								</div>

								{/* Featured Badge */}
								{property.featured && (
									<div className='bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 text-white text-center'>
										<Star className='w-6 h-6 mx-auto mb-2' />
										<div className='font-semibold'>
											Առաջարկվող հայտարարություն
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className='border-t border-gray-200 p-6 bg-gray-50'>
					<div className='flex justify-between items-center'>
						<div className='text-sm text-gray-500'>
							Վերջին փոփոխություն: {formatDate(property.updated_at)}
						</div>
						<div className='flex space-x-3'>
							<button
								onClick={() =>
									window.open(`/properties/${property.custom_id}`, '_blank')
								}
								className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
							>
								Բացել կայքում
							</button>
							<button
								onClick={onClose}
								className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
							>
								Փակել
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PropertyViewPopup
