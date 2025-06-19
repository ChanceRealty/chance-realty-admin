// src/components/FallbackAddressInput.tsx - Simple address input with basic Armenian suggestions
import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X, Check } from 'lucide-react'

interface Coordinates {
	lat: number
	lon: number
}

interface AddressData {
	address: string
	coordinates: Coordinates | null
	details?: any
}

interface FallbackAddressInputProps {
	onAddressSelect: (data: AddressData) => void
	initialValue?: string
	placeholder?: string
	required?: boolean
	disabled?: boolean
	className?: string
}

// Basic Armenian addresses for fallback suggestions
const ARMENIAN_ADDRESSES = [
	{ name: 'Երևան, Արամի փողոց', lat: 40.1776, lon: 44.5126 },
	{ name: 'Երևան, Մաշտոցի պողոտա', lat: 40.1872, lon: 44.5152 },
	{ name: 'Երևան, Բաղրամյան պողոտա', lat: 40.189, lon: 44.5144 },
	{ name: 'Երևան, Նալբանդյան փողոց', lat: 40.1833, lon: 44.5089 },
	{ name: 'Երևան, Սարյան փողոց', lat: 40.1901, lon: 44.5089 },
	{ name: 'Երևան, Կասյան փողոց', lat: 40.1723, lon: 44.5234 },
	{ name: 'Երևան, Վազգեն Սարգսյան փողոց', lat: 40.1845, lon: 44.5234 },
	{ name: 'Երևան, Արշակունյաց պողոտա', lat: 40.1934, lon: 44.5067 },
	{ name: 'Երևան, Կիևյան կամուրջ', lat: 40.1667, lon: 44.5167 },
	{ name: 'Երևան, Կենտրոն թաղամաս', lat: 40.1811, lon: 44.5136 },
	{ name: 'Երևան, Ավան թաղամաս', lat: 40.2167, lon: 44.4667 },
	{ name: 'Երևան, Էրեբունի թաղամաս', lat: 40.1333, lon: 44.5333 },
	{ name: 'Էջմիածին, Մայր Տաճարի հրապարակ', lat: 40.1617, lon: 44.2911 },
	{ name: 'Գյումրի, Վարդանանց պողոտա', lat: 40.7833, lon: 43.85 },
	{ name: 'Վանաձոր, Տիգրան Մեծի պողոտա', lat: 40.8167, lon: 44.4833 },
	{ name: 'Գավառ, Կենտրոնական պողոտա', lat: 40.35, lon: 45.1167 },
	{ name: 'Իջևան, Անհատականության պողոտա', lat: 40.8833, lon: 45.15 },
	{ name: 'Կապան, Շահումյան պողոտա', lat: 39.2067, lon: 46.4067 },
]

const FallbackAddressInput: React.FC<FallbackAddressInputProps> = ({
	onAddressSelect,
	initialValue = '',
	placeholder = 'Մուտքագրեք հասցեն...',
	required = false,
	disabled = false,
	className = '',
}) => {
	const [inputValue, setInputValue] = useState(initialValue)
	const [suggestions, setSuggestions] = useState<typeof ARMENIAN_ADDRESSES>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
	const [useYandexFallback, setUseYandexFallback] = useState(true)

	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionRefs = useRef<(HTMLLIElement | null)[]>([])
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Filter local suggestions based on input
	const filterLocalSuggestions = (query: string) => {
		const filtered = ARMENIAN_ADDRESSES.filter(addr =>
			addr.name.toLowerCase().includes(query.toLowerCase())
		).slice(0, 8)
		setSuggestions(filtered)
		setShowSuggestions(filtered.length > 0)
	}

	// Try Yandex API first, fallback to local suggestions
	const fetchSuggestions = async (query: string) => {
		if (!useYandexFallback) {
			filterLocalSuggestions(query)
			return
		}

		try {
			setIsLoading(true)

			const response = await fetch('/api/yandex/suggest', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
					count: 8,
				}),
			})

			if (response.ok) {
				const data = await response.json()
				if (data.suggestions && data.suggestions.length > 0) {
					// Convert Yandex suggestions to our format
					const yandexSuggestions = data.suggestions.map((s: any) => ({
						name: s.unrestricted_value,
						lat: parseFloat(s.data.geo_lat) || 40.1776,
						lon: parseFloat(s.data.geo_lon) || 44.5126,
						isYandex: true,
						originalData: s,
					}))
					setSuggestions(yandexSuggestions)
					setShowSuggestions(true)
					return
				}
			} else {
				console.warn('Yandex API failed, falling back to local suggestions')
				setUseYandexFallback(false)
			}
		} catch (error) {
			console.warn(
				'Yandex API error, falling back to local suggestions:',
				error
			)
			setUseYandexFallback(false)
		} finally {
			setIsLoading(false)
		}

		// Fallback to local suggestions
		filterLocalSuggestions(query)
	}

	const debouncedSearch = (query: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		timeoutRef.current = setTimeout(() => {
			if (query.length >= 2) {
				fetchSuggestions(query)
			} else {
				setSuggestions([])
				setShowSuggestions(false)
			}
		}, 300)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setInputValue(value)
		setCoordinates(null)
		debouncedSearch(value)
	}

	const handleSuggestionSelect = async (suggestion: any) => {
		setInputValue(suggestion.name)
		setShowSuggestions(false)
		setSuggestions([])
		setSelectedIndex(-1)

		const coords = {
			lat: suggestion.lat,
			lon: suggestion.lon,
		}

		setCoordinates(coords)

		// Call the parent callback
		onAddressSelect({
			address: suggestion.name,
			coordinates: coords,
			details: suggestion.originalData?.data || {},
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
		onAddressSelect({
			address: '',
			coordinates: null,
		})
		inputRef.current?.focus()
	}

	// Geocode manually entered address
	const handleBlur = async () => {
		if (inputValue && !coordinates) {
			setIsLoading(true)
			try {
				const response = await fetch('/api/yandex/geocode', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ address: inputValue }),
				})

				if (response.ok) {
					const data = await response.json()
					if (data.coordinates) {
						const coords = {
							lat: data.coordinates.lat,
							lon: data.coordinates.lon,
						}
						setCoordinates(coords)
						onAddressSelect({
							address: inputValue,
							coordinates: coords,
						})
					}
				}
			} catch (error) {
				console.error('Geocoding failed:', error)
			} finally {
				setIsLoading(false)
			}
		}
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

	return (
		<div className={`relative ${className}`}>
			<div className='relative'>
				<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
					{isLoading ? (
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
					onBlur={handleBlur}
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
          `}
				/>

				{inputValue && (
					<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
						{coordinates ? (
							<Check className='h-5 w-5 text-green-500'>
								<title>Կոորդինատները ստացված են</title>
							</Check>
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

			{/* Status indicator */}
			{!useYandexFallback && (
				<div className='mt-1 text-xs text-orange-600'>
					Օգտագործվում են տեղական առաջարկություններ
				</div>
			)}

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
										<div className='font-medium'>{suggestion.name}</div>
										{(suggestion as any).isYandex && (
											<div className='text-xs text-blue-500'>Yandex</div>
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
				inputValue.length >= 2 && (
					<div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg'>
						<div className='px-4 py-3 text-sm text-gray-500 text-center'>
							Արդյունքներ չգտնվեցին
						</div>
					</div>
				)}
		</div>
	)
}

export default FallbackAddressInput
// src/components/FallbackAddressInput.tsx