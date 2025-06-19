import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, Search, X, Check } from 'lucide-react'

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

interface YandexAddressAutocompleteProps {
	onAddressSelect: (data: AddressData) => void
	initialValue?: string
	placeholder?: string
	required?: boolean
	disabled?: boolean
	className?: string
}

const YandexAddressAutocomplete: React.FC<YandexAddressAutocompleteProps> = ({
	onAddressSelect,
	initialValue = '',
	placeholder = 'Մուտքագրեք հասցեն...',
	required = false,
	disabled = false,
	className = '',
}) => {
	const [inputValue, setInputValue] = useState(initialValue)
	const [suggestions, setSuggestions] = useState<YandexSuggestion[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
	const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
	const [error, setError] = useState<string>('')

	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionRefs = useRef<(HTMLLIElement | null)[]>([])
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	// You'll need to add these to your environment variables
	const YANDEX_API_KEY =
		process.env.NEXT_PUBLIC_YANDEX_API_KEY || 'your-yandex-api-key'

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

			// Using Yandex Suggest API (DaData style)
			// Note: You might need to set up a proxy API route to avoid CORS issues
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

			// Using Yandex Geocoder API
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

		// Get coordinates for the selected address
		let coords = null

		// First, try to use coordinates from suggestion if available
		if (suggestion.data.geo_lat && suggestion.data.geo_lon) {
			coords = {
				lat: parseFloat(suggestion.data.geo_lat),
				lon: parseFloat(suggestion.data.geo_lon),
			}
		} else {
			// Otherwise, geocode the address
			coords = await geocodeAddress(selectedAddress)
		}

		setCoordinates(coords)

		// Call the parent callback
		onAddressSelect({
			address: selectedAddress,
			coordinates: coords,
			details: suggestion.data,
		})
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
		onAddressSelect({
			address: '',
			coordinates: null,
		})
		inputRef.current?.focus()
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
		<div className={`relative ${className}`}>
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
							<span className="relative">
								<Check className='h-5 w-5 text-green-500' />
								<span className="sr-only">Կոորդինատները ստացված են</span>
							</span>
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
			</div>

			{/* Error Message */}
			{error && <div className='mt-1 text-sm text-red-600'>{error}</div>}

			{/* Coordinates Display */}
			{coordinates && (
				<div className='mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm'>
					<div className='flex items-center text-green-800'>
						<MapPin className='h-4 w-4 mr-1' />
						<span className='font-medium'>Կոորդինատներ:</span>
						<span className='ml-2'>
							{coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
						</span>
					</div>
				</div>
			)}

			{/* Suggestions Dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
					<ul className='py-1'>
						{suggestions.map((suggestion, index) => (
							<li
								key={index}
								ref={el => {
									suggestionRefs.current[index] = el
								}}
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
	)
}

export default YandexAddressAutocomplete
