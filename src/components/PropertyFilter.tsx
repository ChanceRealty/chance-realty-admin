'use client'

import { useState, useEffect } from 'react'
import {
	PropertyFilter as FilterType,
	PropertyType,
	ListingType,
	State,
	City,
	PropertyFeature,
} from '@/types/property'

interface PropertyFilterProps {
	onFilterChange: (filter: FilterType) => void
	initialFilter?: FilterType
}

export default function PropertyFilter({
	onFilterChange,
	initialFilter = {},
}: PropertyFilterProps) {
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [features, setFeatures] = useState<PropertyFeature[]>([])
	const [filter, setFilter] = useState<FilterType>(initialFilter)

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
		if (filter.state_id) {
			// Fetch cities for selected state
			fetch(`/api/properties/cities/${filter.state_id}`)
				.then(res => res.json())
				.then(data => setCities(data))
				.catch(error => console.error('Error fetching cities:', error))
		} else {
			setCities([])
		}
	}, [filter.state_id])

const handleFilterChange = (
	key: keyof FilterType,
	value: FilterType[keyof FilterType]
) => {
	const newFilter = { ...filter, [key]: value }

	// Reset city if state changes
	if (key === 'state_id') {
		newFilter.city_id = undefined
	}

	setFilter(newFilter)
	onFilterChange(newFilter)
}

	const propertyTypes: PropertyType[] = [
		'house',
		'apartment',
		'commercial',
		'land',
	]
	const listingTypes: ListingType[] = ['sale', 'rent', 'daily_rent']

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<h2 className='text-xl font-semibold mb-6'>Filter Properties</h2>

			<div className='space-y-6'>
				{/* Property Type */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Property Type
					</label>
					<select
						value={filter.property_type || ''}
						onChange={e =>
							handleFilterChange('property_type', (e.target.value as PropertyType) || undefined)
						}
						className='w-full border border-gray-300 rounded-md p-2'
					>
						<option value=''>All Types</option>
						{propertyTypes.map(type => (
							<option key={type} value={type}>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</option>
						))}
					</select>
				</div>

				{/* Listing Type */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Listing Type
					</label>
					<select
						value={filter.listing_type || ''}
						onChange={e =>
							handleFilterChange('listing_type', (e.target.value as ListingType) || undefined)
						}
						className='w-full border border-gray-300 rounded-md p-2'
					>
						<option value=''>All Listings</option>
						{listingTypes.map(type => (
							<option key={type} value={type}>
								{type.replace('_', ' ').charAt(0).toUpperCase() +
									type.replace('_', ' ').slice(1)}
							</option>
						))}
					</select>
				</div>

				{/* State */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						State
					</label>
					<select
						value={filter.state_id || ''}
						onChange={e =>
							handleFilterChange(
								'state_id',
								e.target.value ? parseInt(e.target.value) : undefined
							)
						}
						className='w-full border border-gray-300 rounded-md p-2'
					>
						<option value=''>All States</option>
						{states.map(state => (
							<option key={state.id} value={state.id}>
								{state.name}
							</option>
						))}
					</select>
				</div>

				{/* City */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						City
					</label>
					<select
						value={filter.city_id || ''}
						onChange={e =>
							handleFilterChange(
								'city_id',
								e.target.value ? parseInt(e.target.value) : undefined
							)
						}
						className='w-full border border-gray-300 rounded-md p-2'
						disabled={!filter.state_id}
					>
						<option value=''>All Cities</option>
						{cities.map(city => (
							<option key={city.id} value={city.id}>
								{city.name}
							</option>
						))}
					</select>
				</div>

				{/* Price Range */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Price Range
					</label>
					<div className='flex space-x-4'>
						<input
							type='number'
							placeholder='Min Price'
							value={filter.min_price || ''}
							onChange={e =>
								handleFilterChange(
									'min_price',
									e.target.value ? parseFloat(e.target.value) : undefined
								)
							}
							className='w-1/2 border border-gray-300 rounded-md p-2'
						/>
						<input
							type='number'
							placeholder='Max Price'
							value={filter.max_price || ''}
							onChange={e =>
								handleFilterChange(
									'max_price',
									e.target.value ? parseFloat(e.target.value) : undefined
								)
							}
							className='w-1/2 border border-gray-300 rounded-md p-2'
						/>
					</div>
				</div>

				{/* Bedrooms and Bathrooms for residential properties */}
				{(filter.property_type === 'house' ||
					filter.property_type === 'apartment' ||
					!filter.property_type) && (
					<>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Bedrooms
							</label>
							<input
								type='number'
								placeholder='Min Bedrooms'
								value={filter.bedrooms || ''}
								onChange={e =>
									handleFilterChange(
										'bedrooms',
										e.target.value ? parseInt(e.target.value) : undefined
									)
								}
								className='w-full border border-gray-300 rounded-md p-2'
								min='0'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Bathrooms
							</label>
							<input
								type='number'
								placeholder='Min Bathrooms'
								value={filter.bathrooms || ''}
								onChange={e =>
									handleFilterChange(
										'bathrooms',
										e.target.value ? parseInt(e.target.value) : undefined
									)
								}
								className='w-full border border-gray-300 rounded-md p-2'
								min='0'
								step='0.5'
							/>
						</div>
					</>
				)}

				{/* Features */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Features
					</label>
					<div className='space-y-2'>
						{features.map(feature => (
							<label key={feature.id} className='flex items-center'>
								<input
									type='checkbox'
									checked={filter.features?.includes(feature.id) || false}
									onChange={e => {
										const currentFeatures = filter.features || []
										const newFeatures = e.target.checked
											? [...currentFeatures, feature.id]
											: currentFeatures.filter(id => id !== feature.id)
										handleFilterChange(
											'features',
											newFeatures.length > 0 ? newFeatures : undefined
										)
									}}
									className='mr-2'
								/>
								{feature.name}
							</label>
						))}
					</div>
				</div>

				{/* Clear Filters */}
				<button
					onClick={() => {
						setFilter({})
						onFilterChange({})
					}}
					className='w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors'
				>
					Clear Filters
				</button>
			</div>
		</div>
	)
}
