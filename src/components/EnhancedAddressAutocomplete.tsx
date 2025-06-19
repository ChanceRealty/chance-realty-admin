import React, { useState, useEffect, useRef } from 'react'
import {
	MapPin,
	Loader2,
	Search,
	X,
	Check,
	ExternalLink,
	Map,
	AlertTriangle,
} from 'lucide-react'

interface YandexSuggestion {
	value: string
	unrestricted_value: string
	data: {
		postal_code?: string
		country?: string
		region?: string
		city?: string
		street?: string
		house?: string
		geo_lat?: string
		geo_lon?: string
	}
}

interface Coordinates {
	lat: number
	lon: number
}

interface AddressData {
	address: string
	coordinates: Coordinates | null
	details?: YandexSuggestion['data']
}

interface EnhancedAddressAutocompleteProps {
	onAddressSelect: (data: AddressData) => void
	initialValue?: string
	initialCoordinates?: Coordinates | null
	placeholder?: string
	required?: boolean
	disabled?: boolean
	className?: string
	showMapPreview?: boolean
	showCoordinatesInput?: boolean
}

const EnhancedAddressAutocomplete: React.FC<
	EnhancedAddressAutocompleteProps
> = ({
	onAddressSelect,
	initialValue = '',
	initialCoordinates = null,
	placeholder = 'Մուտքագրեք հասցեն...',
	required = false,
	disabled = false,
	className = '',
	showMapPreview = true,
	showCoordinatesInput = false,
}) => {
	const [inputValue, setInputValue] = useState(initialValue)
	const [suggestions, setSuggestions] = useState<YandexSuggestion[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const [coordinates, setCoordinates] = useState<Coordinates | null>(
		initialCoordinates
	)
	const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [manualCoordinates, setManualCoordinates] = useState({
		lat: initialCoordinates?.lat?.toString() || '',
		lon: initialCoordinates?.lon?.toString() || '',
	})

	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionRefs = useRef<(HTMLLIElement | null)[]>([])
	const timeoutRef = useRef<NodeJS.Timeout>()

	// Debounced search function
	const debouncedSearch = (query: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		timeoutRef.current = setTimeout(() => {
			if (query.length >= 3) {
				fetchSuggestions(query)
			} else {
				setSuggestions([])
				setShowSuggestions(false)
			}
		}, 300)
	}

	const fetchSuggestions = async (query: string) => {
		try {
			setIsLoading(true)
			setError('')

			const response = await fetch('/api/yandex/suggest', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
					count: 10,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to fetch suggestions')
			}

			const data = await response.json()
			setSuggestions(data.suggestions || [])
			setShowSuggestions(true)
			setSelectedIndex(-1)
		} catch (err) {
			console.error('Error fetching suggestions:', err)
			setError('Առաջարկությունների բեռնման սխալ')
			setSuggestions([])
		} finally {
			setIsLoading(false)
		}
	}

	const geocodeAddress = async (
		address: string
	): Promise<Coordinates | null> => {
		try {
			setIsGeocodingLoading(true)
			setError('')

			const response = await fetch('/api/yandex/geocode', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					address,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to geocode address')
			}

			const data = await response.json()

			if (data.coordinates) {
				return {
					lat: parseFloat(data.coordinates.lat),
					lon: parseFloat(data.coordinates.lon),
				}
			}

			return null
		} catch (err) {
			console.error('Error geocoding address:', err)
			setError('Կոորդինատների ստացման սխալ')
			return null
		} finally {
			setIsGeocodingLoading(false)
		}
	}

	const reverseGeocode = async (
		lat: number,
		lon: number
	): Promise<string | null> => {
		try {
			const response = await fetch(`/api/yandex/geocode?lat=${lat}&lon=${lon}`)

			if (!response.ok) {
				throw new Error('Failed to reverse geocode')
			}

			const data = await response.json()
			return data.address || null
		} catch (err) {
			console.error('Error reverse geocoding:', err)
			return null
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setInputValue(value)
		setCoordinates(null)
		debouncedSearch(value)
	}

	const handleSuggestionSelect = async (suggestion: YandexSuggestion) => {
		const selectedAddress = suggestion.unrestricted_value
		setInputValue(selectedAddress)
		setShowSuggestions(false)
		setSuggestions([])
		setSelectedIndex(-1)

		let coords = null

		if (suggestion.data.geo_lat && suggestion.data.geo_lon) {
			coords = {
				lat: parseFloat(suggestion.data.geo_lat),
				lon: parseFloat(suggestion.data.geo_lon),
			}
		} else {
			coords = await geocodeAddress(selectedAddress)
		}

		setCoordinates(coords)

		if (coords) {
			setManualCoordinates({
				lat: coords.lat.toString(),
				lon: coords.lon.toString(),
			})
		}

		onAddressSelect({
			address: selectedAddress,
			coordinates: coords,
			details: suggestion.data,
		})
	}

	const handleManualCoordinatesChange = async (
		field: 'lat' | 'lon',
		value: string
	) => {
		setManualCoordinates(prev => ({ ...prev, [field]: value }))

		const lat =
			field === 'lat' ? parseFloat(value) : parseFloat(manualCoordinates.lat)
		const lon =
			field === 'lon' ? parseFloat(value) : parseFloat(manualCoordinates.lon)

		if (
			!isNaN(lat) &&
			!isNaN(lon) &&
			lat >= -90 &&
			lat <= 90 &&
			lon >= -180 &&
			lon <= 180
		) {
			const coords = { lat, lon }
			setCoordinates(coords)

			// Try to get address from coordinates
			if (inputValue.trim() === '') {
				const address = await reverseGeocode(lat, lon)
				if (address) {
					setInputValue(address)
				}
			}

			onAddressSelect({
				address: inputValue,
				coordinates: coords,
			})
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!showSuggestions || suggestions.length === 0) return

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault()
				setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
				break
			case 'ArrowUp':
				e.preventDefault()
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
				break
			case 'Enter':
				e.preventDefault()
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					handleSuggestionSelect(suggestions[selectedIndex])
				}
				break
			case 'Escape':
				setShowSuggestions(false)
				setSelectedIndex(-1)
				inputRef.current?.blur()
				break
		}
	}

	const clearInput = () => {
		setInputValue('')
		setCoordinates(null)
		setSuggestions([])
		setShowSuggestions(false)
		setSelectedIndex(-1)
		setError('')
		setManualCoordinates({ lat: '', lon: '' })
		onAddressSelect({
			address: '',
			coordinates: null,
		})
		inputRef.current?.focus()
	}

	const getMapUrl = () => {
		if (!coordinates) return null
		return `https://yandex.ru/maps/?ll=${coordinates.lon},${coordinates.lat}&z=16&pt=${coordinates.lon},${coordinates.lat}`
	}

	const getStaticMapUrl = () => {
		if (!coordinates) return null
		return `https://static-maps.yandex.ru/1.x/?ll=${coordinates.lon},${coordinates.lat}&size=400,200&z=14&l=map&pt=${coordinates.lon},${coordinates.lat},pm2rdm`
	}

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Scroll selected suggestion into view
	useEffect(() => {
		if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
			suggestionRefs.current[selectedIndex]?.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			})
		}
	}, [selectedIndex])

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Main Address Input */}
			<div className='relative'>
				<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
					{isLoading || isGeocodingLoading ? (
						<Loader2 className='h-5 w-5 text-gray-400 animate-spin' />
					) : (
						<MapPin className='h-5 w-5 text-gray-400' />
					)}
				</div>

				<input
					ref={inputRef}
					type='text'
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => {
						if (suggestions.length > 0) {
							setShowSuggestions(true)
						}
					}}
					placeholder={placeholder}
					required={required}
					disabled={disabled}
					className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-black
            ${error ? 'border-red-300 focus:ring-red-500' : ''}
          `}
				/>

				{inputValue && (
					<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
						{coordinates ? (
							<Check
								className='h-5 w-5 text-green-500'
								title='Կոորդինատները ստացված են'
							/>
						) : (
							<button
								type='button'
								onClick={clearInput}
								className='text-gray-400 hover:text-gray-600'
								title='Մաքրել'
							>
								<X className='h-5 w-5' />
							</button>
						)}
					</div>
				)}

				{/* Suggestions Dropdown */}
				{showSuggestions && suggestions.length > 0 && (
					<div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
						<ul className='py-1'>
							{suggestions.map((suggestion, index) => (
								<li
									key={index}
									ref={el => (suggestionRefs.current[index] = el)}
									className={`
                    px-4 py-2 cursor-pointer text-sm
                    ${
											index === selectedIndex
												? 'bg-blue-100 text-blue-900'
												: 'text-gray-900 hover:bg-gray-100'
										}
                  `}
									onClick={() => handleSuggestionSelect(suggestion)}
								>
									<div className='flex items-start'>
										<MapPin className='h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0' />
										<div className='flex-grow'>
											<div className='font-medium'>{suggestion.value}</div>
											{suggestion.data.postal_code && (
												<div className='text-gray-500 text-xs'>
													{suggestion.data.postal_code}
												</div>
											)}
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* No results message */}
				{showSuggestions &&
					!isLoading &&
					suggestions.length === 0 &&
					inputValue.length >= 3 && (
						<div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg'>
							<div className='px-4 py-3 text-sm text-gray-500 text-center'>
								Արդյունքներ չգտնվեցին
							</div>
						</div>
					)}
			</div>

			{/* Error Message */}
			{error && (
				<div className='flex items-center p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg'>
					<AlertTriangle className='h-4 w-4 mr-2 flex-shrink-0' />
					{error}
				</div>
			)}

			{/* Manual Coordinates Input */}
			{showCoordinatesInput && (
				<div className='grid grid-cols-2 gap-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Լայնություն (Latitude)
						</label>
						<input
							type='number'
							step='any'
							value={manualCoordinates.lat}
							onChange={e =>
								handleManualCoordinatesChange('lat', e.target.value)
							}
							className='w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder='40.1777'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Երկարություն (Longitude)
						</label>
						<input
							type='number'
							step='any'
							value={manualCoordinates.lon}
							onChange={e =>
								handleManualCoordinatesChange('lon', e.target.value)
							}
							className='w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder='44.5152'
						/>
					</div>
				</div>
			)}

			{/* Coordinates Display & Map Preview */}
			{coordinates && (
				<div className='space-y-4'>
					{/* Coordinates Info */}
					<div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center text-green-800'>
								<MapPin className='h-4 w-4 mr-2' />
								<span className='font-medium'>Կոորդինատներ:</span>
								<span className='ml-2'>
									{coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
								</span>
							</div>
							{getMapUrl() && (
								<a
									href={getMapUrl()!}
									target='_blank'
									rel='noopener noreferrer'
									className='flex items-center text-green-600 hover:text-green-800 text-sm'
								>
									<ExternalLink className='h-4 w-4 mr-1' />
									Բացել քարտեզում
								</a>
							)}
						</div>
					</div>

					{/* Map Preview */}
					{showMapPreview && (
						<div className='border border-gray-300 rounded-lg overflow-hidden'>
							<div className='bg-gray-100 px-4 py-2 border-b flex items-center'>
								<Map className='h-4 w-4 mr-2 text-gray-600' />
								<span className='text-sm font-medium text-gray-700'>
									Քարտեզի նախադիտում
								</span>
							</div>
							<div className='relative'>
								<img
									src={getStaticMapUrl()!}
									alt='Location preview'
									className='w-full h-48 object-cover'
									onError={e => {
										// Hide image if it fails to load
										e.currentTarget.style.display = 'none'
									}}
								/>
								<div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
									<div className='text-center'>
										<Map className='h-8 w-8 text-gray-400 mx-auto mb-2' />
										<p className='text-sm text-gray-600'>Քարտեզի նախադիտում</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default EnhancedAddressAutocomplete
