// src/lib/translateService.ts
import { Translate } from '@google-cloud/translate/build/src/v2'

interface TranslationResult {
	text: string
	detectedSourceLanguage?: string
}

interface TranslationError {
	success: false
	error: string
}

interface TranslationSuccess {
	success: true
	translations: {
		ru: TranslationResult
		en: TranslationResult
	}
}

type TranslationResponse = TranslationSuccess | TranslationError

class TranslateService {
	private translate: Translate | null = null
	private initialized = false

	constructor() {
		this.initializeTranslate()
	}

	private async initializeTranslate() {
		try {
			// Check if we have the required environment variables
			const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
			const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

			if (!apiKey && !credentialsPath) {
				console.warn(
					'⚠️ Google Translate API not configured. Translations will be skipped.'
				)
				return
			}

			// Initialize with API key (simpler setup)
			if (apiKey) {
				this.translate = new Translate({
					key: apiKey,
				})
			}
			// Initialize with service account (more secure for production)
			else if (credentialsPath) {
				this.translate = new Translate({
					keyFilename: credentialsPath,
				})
			}

			// Test the connection
			if (this.translate) {
				await this.translate.getLanguages()
				console.log('✅ Google Translate API initialized successfully')
				this.initialized = true
			}
		} catch (error) {
			console.error('❌ Failed to initialize Google Translate API:', error)
			this.translate = null
			this.initialized = false
		}
	}

	async translateText(
		text: string,
		targetLanguage: string,
		sourceLanguage = 'hy'
	): Promise<TranslationResult | null> {
		if (!this.initialized || !this.translate) {
			console.warn('Google Translate not available, skipping translation')
			return null
		}

		try {
			console.log(
				`🌐 Translating text from ${sourceLanguage} to ${targetLanguage}`
			)

			const [translation] = await this.translate.translate(text, {
				from: sourceLanguage,
				to: targetLanguage,
			})

			return {
				text: Array.isArray(translation) ? translation[0] : translation,
				detectedSourceLanguage: sourceLanguage,
			}
		} catch (error) {
			console.error(`❌ Translation failed for ${targetLanguage}:`, error)
			return null
		}
	}

	async translatePropertyTexts(
		title: string,
		description: string,
		sourceLanguage = 'hy'
	): Promise<TranslationResponse> {
		if (!this.initialized || !this.translate) {
			return {
				success: false,
				error: 'Translation service not available',
			}
		}

		try {
			console.log('🌐 Starting property translation...')

			// Translate to Russian
			const [titleRu, descriptionRu] = await Promise.all([
				this.translateText(title, 'ru', sourceLanguage),
				this.translateText(description, 'ru', sourceLanguage),
			])

			// Translate to English
			const [titleEn, descriptionEn] = await Promise.all([
				this.translateText(title, 'en', sourceLanguage),
				this.translateText(description, 'en', sourceLanguage),
			])

			if (!titleRu || !descriptionRu || !titleEn || !descriptionEn) {
				throw new Error('Some translations failed')
			}

			console.log('✅ Property translation completed successfully')

			return {
				success: true,
				translations: {
					ru: {
						text: `${titleRu.text}|||${descriptionRu.text}`, // We'll split this later
						detectedSourceLanguage: sourceLanguage,
					},
					en: {
						text: `${titleEn.text}|||${descriptionEn.text}`, // We'll split this later
						detectedSourceLanguage: sourceLanguage,
					},
				},
			}
		} catch (error) {
			console.error('❌ Property translation failed:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Translation failed',
			}
		}
	}

	// Batch translate multiple texts
	async batchTranslate(
		texts: string[],
		targetLanguage: string,
		sourceLanguage = 'hy'
	): Promise<(TranslationResult | null)[]> {
		if (!this.initialized || !this.translate) {
			return texts.map(() => null)
		}

		try {
			const translations = await Promise.all(
				texts.map(text =>
					this.translateText(text, targetLanguage, sourceLanguage)
				)
			)

			return translations
		} catch (error) {
			console.error('❌ Batch translation failed:', error)
			return texts.map(() => null)
		}
	}

	// Check if service is available
	isAvailable(): boolean {
		return this.initialized && this.translate !== null
	}

	// Get supported languages
	async getSupportedLanguages() {
		if (!this.initialized || !this.translate) {
			return []
		}

		try {
			const [languages] = await this.translate.getLanguages()
			return languages
		} catch (error) {
			console.error('❌ Failed to get supported languages:', error)
			return []
		}
	}

	// Detect language of text
	async detectLanguage(text: string) {
		if (!this.initialized || !this.translate) {
			return null
		}

		try {
			const [detection] = await this.translate.detect(text)
			return detection
		} catch (error) {
			console.error('❌ Language detection failed:', error)
			return null
		}
	}
}

// Create singleton instance
export const translateService = new TranslateService()

// Helper functions for easy usage
export async function translatePropertyData(
	title: string,
	description: string
): Promise<{
	title_ru?: string
	title_en?: string
	description_ru?: string
	description_en?: string
}> {
	const result = await translateService.translatePropertyTexts(
		title,
		description
	)

	if (!result.success) {
		console.warn('Translation failed, returning empty translations')
		return {}
	}

	// Parse the combined translations
	const [titleRu, descriptionRu] = result.translations.ru.text.split('|||')
	const [titleEn, descriptionEn] = result.translations.en.text.split('|||')

	return {
		title_ru: titleRu,
		title_en: titleEn,
		description_ru: descriptionRu,
		description_en: descriptionEn,
	}
}
