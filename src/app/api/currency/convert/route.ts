// src/app/api/currency/convert/route.ts
import { NextResponse } from 'next/server'

interface ExchangeRateResponse {
	success: boolean
	timestamp: number
	base: string
	date: string
	rates: {
		[key: string]: number
	}
}

// In-memory cache for exchange rates
const rateCache = new Map<string, { rate: number; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const amount = parseFloat(searchParams.get('amount') || '0')
		const fromCurrency = searchParams.get('from') || 'USD'
		const toCurrencies = searchParams.get('to')?.split(',') || ['RUB', 'AMD']

		if (amount <= 0) {
			return corsResponse(
				NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
			)
		}

		// Get exchange rates
		const rates = await getExchangeRates(fromCurrency, toCurrencies)

		// Convert amounts
		const conversions = toCurrencies.map(currency => {
			const rate = rates[currency] || 1
			const convertedAmount = amount * rate
			return {
				amount: convertedAmount,
				currency,
				formattedAmount: formatCurrency(convertedAmount, currency),
				rate,
			}
		})

		const response = NextResponse.json({
			success: true,
			original: {
				amount,
				currency: fromCurrency,
				formattedAmount: formatCurrency(amount, fromCurrency),
			},
			conversions,
			timestamp: Date.now(),
			cached: false,
		})

		return corsResponse(response)
	} catch (error) {
		console.error('Currency conversion error:', error)
		const response = NextResponse.json(
			{ error: 'Failed to convert currency' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}

async function getExchangeRates(
	baseCurrency: string,
	targetCurrencies: string[]
): Promise<Record<string, number>> {
	const cacheKey = `${baseCurrency}-${targetCurrencies.join(',')}`
	const cached = rateCache.get(cacheKey)

	// Return cached rates if still valid
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		const rates: Record<string, number> = {}
		targetCurrencies.forEach(currency => {
			const currencyCache = rateCache.get(`${baseCurrency}-${currency}`)
			if (currencyCache) {
				rates[currency] = currencyCache.rate
			}
		})
		if (Object.keys(rates).length === targetCurrencies.length) {
			return rates
		}
	}

	try {
		const symbols = targetCurrencies.join(',')
		const response = await fetch(
			`https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${symbols}`,
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
			rateCache.set(`${baseCurrency}-${currency}`, { rate, timestamp })
		})

		return data.rates
	} catch (error) {
		console.error('Error fetching exchange rates:', error)
		// Return fallback rates if API fails
		return getFallbackRates(targetCurrencies)
	}
}

function getFallbackRates(targetCurrencies: string[]): Record<string, number> {
	const fallbackRates: Record<string, number> = {
		RUB: 95.5, // Approximate USD to RUB
		AMD: 387.5, // Approximate USD to AMD
	}

	const result: Record<string, number> = {}
	targetCurrencies.forEach(currency => {
		if (fallbackRates[currency]) {
			result[currency] = fallbackRates[currency]
		}
	})

	return result
}

function formatCurrency(amount: number, currency: string): string {
	const currencyConfig: Record<
		string,
		{ locale: string; options: Intl.NumberFormatOptions }
	> = {
		USD: {
			locale: 'en-US',
			options: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
		},
		RUB: {
			locale: 'ru-RU',
			options: { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 },
		},
		AMD: {
			locale: 'hy-AM',
			options: { style: 'currency', currency: 'AMD', maximumFractionDigits: 0 },
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

// GET rates endpoint for real-time rate checking
export async function GET_RATES() {
	try {
		const rates = await getExchangeRates('USD', ['RUB', 'AMD'])

		const response = NextResponse.json({
			success: true,
			base: 'USD',
			rates,
			timestamp: Date.now(),
		})

		return corsResponse(response)
	} catch (error) {
		console.error('Error fetching exchange rates:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch exchange rates' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
