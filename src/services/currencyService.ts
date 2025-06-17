// src/services/currencyService.ts
interface ExchangeRateResponse {
	success: boolean
	timestamp: number
	base: string
	date: string
	rates: {
		[key: string]: number
	}
}

interface CurrencyConversion {
	amount: number
	currency: string
	formattedAmount: string
}

class CurrencyService {
	private baseUrl = 'https://api.exchangerate.host'
	private cache = new Map<string, { rate: number; timestamp: number }>()
	private cacheExpiration = 30 * 60 * 1000 // 30 minutes

	// Get exchange rates from API
	async getExchangeRates(
		baseCurrency = 'USD',
		targetCurrencies: string[] = ['RUB', 'AMD']
	): Promise<Record<string, number>> {
		try {
			const cacheKey = `${baseCurrency}-${targetCurrencies.join(',')}`
			const cached = this.cache.get(cacheKey)

			// Return cached rates if still valid
			if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
				const rates: Record<string, number> = {}
				targetCurrencies.forEach(currency => {
					const currencyCache = this.cache.get(`${baseCurrency}-${currency}`)
					if (currencyCache) {
						rates[currency] = currencyCache.rate
					}
				})
				if (Object.keys(rates).length === targetCurrencies.length) {
					return rates
				}
			}

			const symbols = targetCurrencies.join(',')
			const response = await fetch(
				`${this.baseUrl}/latest?base=${baseCurrency}&symbols=${symbols}`,
				{
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				}
			)

			if (!response.ok) {
				throw new Error(`Exchange rate API error: ${response.status}`)
			}

			const data: ExchangeRateResponse = await response.json()

			if (!data.success) {
				throw new Error('Exchange rate API returned error')
			}

			// Cache the rates
			const timestamp = Date.now()
			Object.entries(data.rates).forEach(([currency, rate]) => {
				this.cache.set(`${baseCurrency}-${currency}`, { rate, timestamp })
			})

			return data.rates
		} catch (error) {
			console.error('Error fetching exchange rates:', error)
			// Return fallback rates if API fails
			return this.getFallbackRates(targetCurrencies)
		}
	}

	// Fallback rates in case API is unavailable
	private getFallbackRates(targetCurrencies: string[]): Record<string, number> {
		const fallbackRates: Record<string, number> = {
			RUB: 95.5, // Approximate USD to RUB
			AMD: 390.5, // Approximate USD to AMD
		}

		const result: Record<string, number> = {}
		targetCurrencies.forEach(currency => {
			if (fallbackRates[currency]) {
				result[currency] = fallbackRates[currency]
			}
		})

		return result
	}

	// Convert amount from one currency to multiple currencies
	async convertCurrency(
		amount: number,
		fromCurrency = 'USD',
		toCurrencies: string[] = ['RUB', 'AMD']
	): Promise<CurrencyConversion[]> {
		try {
			if (fromCurrency === 'USD') {
				const rates = await this.getExchangeRates('USD', toCurrencies)

				return toCurrencies.map(currency => {
					const rate = rates[currency] || 1
					const convertedAmount = amount * rate
					return {
						amount: convertedAmount,
						currency,
						formattedAmount: this.formatCurrency(convertedAmount, currency),
					}
				})
			} else {
				// If source currency is not USD, first convert to USD, then to target currencies
				const usdRate = await this.getExchangeRates(fromCurrency, ['USD'])
				const usdAmount = amount * (usdRate['USD'] || 1)

				return this.convertCurrency(usdAmount, 'USD', toCurrencies)
			}
		} catch (error) {
			console.error('Currency conversion error:', error)
			return toCurrencies.map(currency => ({
				amount,
				currency,
				formattedAmount: this.formatCurrency(amount, currency),
			}))
		}
	}

	// Format currency with proper symbols and localization
	formatCurrency(amount: number, currency: string): string {
		const currencyConfig: Record<
			string,
			{ locale: string; options: Intl.NumberFormatOptions }
		> = {
			USD: {
				locale: 'en-US',
				options: {
					style: 'currency',
					currency: 'USD',
					maximumFractionDigits: 0,
				},
			},
			RUB: {
				locale: 'ru-RU',
				options: {
					style: 'currency',
					currency: 'RUB',
					maximumFractionDigits: 0,
				},
			},
			AMD: {
				locale: 'hy-AM',
				options: {
					style: 'currency',
					currency: 'AMD',
					maximumFractionDigits: 0,
				},
			},
		}

		const config = currencyConfig[currency] || currencyConfig['USD']

		try {
			return new Intl.NumberFormat(config.locale, config.options).format(amount)
		} catch (error) {
			// Fallback formatting if Intl fails
			const symbols: Record<string, string> = {
				USD: '$',
				RUB: '₽',
				AMD: '֏',
			}
			const symbol = symbols[currency] || currency
			return `${symbol}${amount.toLocaleString()}`
		}
	}

	// Get currency symbol
	getCurrencySymbol(currency: string): string {
		const symbols: Record<string, string> = {
			USD: '$',
			RUB: '₽',
			AMD: '֏',
		}
		return symbols[currency] || currency
	}

	// Get supported currencies
	getSupportedCurrencies(): Array<{
		code: string
		name: string
		symbol: string
	}> {
		return [
			{ code: 'USD', name: 'US Dollar', symbol: '$' },
			{ code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
			{ code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
		]
	}

	// Clear cache (useful for testing or manual refresh)
	clearCache(): void {
		this.cache.clear()
	}

	// Check if cache is valid
	isCacheValid(cacheKey: string): boolean {
		const cached = this.cache.get(cacheKey)
		return cached ? Date.now() - cached.timestamp < this.cacheExpiration : false
	}
}

// Create singleton instance
export const currencyService = new CurrencyService()

// Helper function for easy price conversion
export async function convertPrice(
	price: number,
	fromCurrency = 'USD'
): Promise<{
	original: CurrencyConversion
	conversions: CurrencyConversion[]
}> {
	const conversions = await currencyService.convertCurrency(
		price,
		fromCurrency,
		['RUB', 'AMD']
	)

	return {
		original: {
			amount: price,
			currency: fromCurrency,
			formattedAmount: currencyService.formatCurrency(price, fromCurrency),
		},
		conversions,
	}
}

// Hook for React components
export function useCurrencyConverter() {
	return {
		convertPrice,
		formatCurrency: currencyService.formatCurrency.bind(currencyService),
		getSupportedCurrencies:
			currencyService.getSupportedCurrencies.bind(currencyService),
		getCurrencySymbol: currencyService.getCurrencySymbol.bind(currencyService),
	}
}
