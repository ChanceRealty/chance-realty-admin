// src/components/PropertyCard.tsx
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react'
import { Property } from '@/types/property'

interface PropertyCardProps {
	property: Property
	onFavoriteClick?: (propertyId: number) => void
	isFavorited?: boolean
}

export default function PropertyCard({
	property,
	onFavoriteClick,
	isFavorited = false,
}: PropertyCardProps) {
	const primaryImage =
		property.images?.find(img => img.is_primary) || property.images?.[0]

	const formatPrice = (price: number, listingType: string) => {
		const formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: property.currency || 'USD',
			maximumFractionDigits: 0,
		}).format(price)

		switch (listingType) {
			case 'rent':
				return `${formatted}/month`
			case 'daily_rent':
				return `${formatted}/day`
			default:
				return formatted
		}
	}

	const getAreaInfo = () => {
		if ('attributes' in property) {
			if (property.property_type === 'land') {
				return `${property.attributes.area_acres} acres`
			} else if ('area_sqft' in property.attributes) {
				return `${property.attributes.area_sqft} sq ft`
			}
		}
		return null
	}

	return (
		<div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
			<div className='relative h-64'>
				{primaryImage ? (
					<Image
						src={primaryImage.url}
						alt={property.title}
						fill
						className='object-cover'
					/>
				) : (
					<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
						<span className='text-gray-400'>No image available</span>
					</div>
				)}

				<div className='absolute top-4 left-4'>
					<span className='bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium'>
						{property.listing_type.replace('_', ' ').toUpperCase()}
					</span>
				</div>

				{onFavoriteClick && (
					<button
						onClick={e => {
							e.preventDefault()
							onFavoriteClick(property.id)
						}}
						className='absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow'
					>
						<Heart
							className={`w-5 h-5 ${
								isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
							}`}
						/>
					</button>
				)}
			</div>

			<Link href={`/properties/${property.id}`}>
				<div className='p-6'>
					<h3 className='text-xl font-semibold mb-2 line-clamp-1'>
						{property.title}
					</h3>

					<div className='flex items-center text-gray-600 mb-4'>
						<MapPin className='w-4 h-4 mr-1' />
						<span className='text-sm'>
							{property.city?.name},{' '}
							{property.state?.code || property.state?.name}
						</span>
					</div>

					<div className='flex items-center justify-between mb-4'>
						<div className='text-2xl font-bold text-blue-600'>
							{formatPrice(property.price, property.listing_type)}
						</div>
					</div>

					<div className='flex items-center space-x-4 text-gray-600'>
						{property.property_type === 'house' ||
						property.property_type === 'apartment' ? (
							<>
								{'attributes' in property &&
									'bedrooms' in property.attributes && (
										<div className='flex items-center'>
											<Bed className='w-4 h-4 mr-1' />
											<span>{property.attributes.bedrooms}</span>
										</div>
									)}
								{'attributes' in property &&
									'bathrooms' in property.attributes && (
										<div className='flex items-center'>
											<Bath className='w-4 h-4 mr-1' />
											<span>{property.attributes.bathrooms}</span>
										</div>
									)}
							</>
						) : null}

						{getAreaInfo() && (
							<div className='flex items-center'>
								<Maximize className='w-4 h-4 mr-1' />
								<span>{getAreaInfo()}</span>
							</div>
						)}

					</div>
				</div>
			</Link>
		</div>
	)
}

// src/components/PropertyFilter.tsx
