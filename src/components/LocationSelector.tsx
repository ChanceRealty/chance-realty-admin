// src/components/LocationSelector.tsx - Fixed for Yerevan districts (city_id nullable)
'use client'

import { useState, useEffect } from 'react'
import { State, City, District } from '@/types/property'

interface LocationSelectorProps {
	stateId?: string
	cityId?: string
	districtId?: string
	onStateChange: (stateId: string) => void
	onCityChange: (cityId: string) => void
	onDistrictChange: (districtId: string) => void
	required?: boolean
	disabled?: boolean
}

export default function LocationSelector({
	stateId = '',
	cityId = '',
	districtId = '',
	onStateChange,
	onCityChange,
	onDistrictChange,
	required = false,
	disabled = false,
}: LocationSelectorProps) {
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [districts, setDistricts] = useState<District[]>([])
	const [selectedState, setSelectedState] = useState<State | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadingCities, setLoadingCities] = useState(false)
	const [loadingDistricts, setLoadingDistricts] = useState(false)

	// Fetch states on component mount
	useEffect(() => {
		fetchStates()
	}, [])

	// Handle state selection changes
	useEffect(() => {
		if (stateId) {
			const state = states.find(s => s.id === parseInt(stateId))
			setSelectedState(state || null)

			if (state?.uses_districts) {
				// For Yerevan: load districts and clear city_id (set to null)
				console.log('🏘️ Yerevan selected - loading districts, clearing city_id')
				fetchDistricts(parseInt(stateId))
				setCities([])
				onCityChange('') // Clear city_id for Yerevan (will be null in DB)
			} else {
				// For other states: load cities and clear district_id
				console.log(
					'🏙️ Non-Yerevan state selected - loading cities, clearing district_id'
				)
				fetchCities(parseInt(stateId))
				setDistricts([])
				onDistrictChange('') // Clear district_id for non-Yerevan states
			}
		} else {
			setSelectedState(null)
			setCities([])
			setDistricts([])
		}
	}, [stateId, states])

	const fetchStates = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/properties/states')
			if (response.ok) {
				const data = await response.json()
				setStates(data)
			}
		} catch (error) {
			console.error('Error fetching states:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchCities = async (stateId: number) => {
		try {
			setLoadingCities(true)
			const response = await fetch(`/api/properties/cities/${stateId}`)
			if (response.ok) {
				const data = await response.json()
				setCities(data)
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
		} finally {
			setLoadingCities(false)
		}
	}

	const fetchDistricts = async (stateId: number) => {
		try {
			setLoadingDistricts(true)
			const response = await fetch(`/api/properties/districts/${stateId}`)
			if (response.ok) {
				const data = await response.json()
				setDistricts(data)
			}
		} catch (error) {
			console.error('Error fetching districts:', error)
		} finally {
			setLoadingDistricts(false)
		}
	}

	const handleStateChange = (value: string) => {
		onStateChange(value)
		// Reset both city and district when state changes
		onCityChange('')
		onDistrictChange('')
	}

	if (loading) {
		return (
			<div className='space-y-4'>
				<div className='animate-pulse'>
					<div className='h-4 bg-gray-200 rounded w-24 mb-2'></div>
					<div className='h-10 bg-gray-200 rounded'></div>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			{/* State Selection */}
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-2'>
					Մարզ / Նահանգ
				</label>
				<select
					value={stateId}
					onChange={e => handleStateChange(e.target.value)}
					required={required}
					disabled={disabled}
					className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
				>
					<option value=''>Ընտրեք մարզը</option>
					{states.map(state => (
						<option key={state.id} value={state.id}>
							{state.name}
							{state.uses_districts && ' (թաղամասեր)'}
						</option>
					))}
				</select>
			</div>

			{/* District Selection (for Yerevan only) */}
			{selectedState?.uses_districts && (
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Թաղամաս <span className='text-red-500'>*</span>
					</label>
					<select
						value={districtId}
						onChange={e => onDistrictChange(e.target.value)}
						required={required}
						disabled={disabled || !stateId || loadingDistricts}
						className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
					>
						<option value=''>Ընտրեք թաղամասը</option>
						{loadingDistricts ? (
							<option disabled>Բեռնվում է...</option>
						) : (
							districts.map(district => (
								<option key={district.id} value={district.id}>
									{district.name_hy}
								</option>
							))
						)}
					</select>
					<p className='text-sm text-blue-600 mt-1'>
						💡 Երևանի համար ընտրեք թաղամասը (քաղաք ավտոմատ կնշվի)
					</p>
				</div>
			)}

			{/* City Selection (for non-Yerevan states only) */}
			{selectedState && !selectedState.uses_districts && (
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Քաղաք <span className='text-red-500'>*</span>
					</label>
					<select
						value={cityId}
						onChange={e => onCityChange(e.target.value)}
						required={required}
						disabled={disabled || !stateId || loadingCities}
						className='w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
					>
						<option value=''>Ընտրեք քաղաքը</option>
						{loadingCities ? (
							<option disabled>Բեռնվում է...</option>
						) : (
							cities.map(city => (
								<option key={city.id} value={city.id}>
									{city.name}
								</option>
							))
						)}
					</select>
				</div>
			)}

			{/* Helper Text */}
			{selectedState && (
				<div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
					<p className='text-sm text-blue-800'>
						{selectedState.uses_districts ? (
							<>
								<strong>Երևան:</strong> Ընտրեք թաղամասը։ Քաղաքը ավտոմատ կլինի
								"Երևան"։
							</>
						) : (
							<>
								<strong>{selectedState.name}:</strong> Ընտրեք քաղաքը մարզում։
							</>
						)}
					</p>
				</div>
			)}
		</div>
	)
}
