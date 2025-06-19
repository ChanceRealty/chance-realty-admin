// src/services/propertyService.ts - Updated with language support
import { sql } from '@vercel/postgres'

// Define a type for the filter parameter
type PropertyFilter = {
	property_type?: string
	listing_type?: string
	state_id?: number
	city_id?: number
	min_price?: number
	max_price?: number
	bedrooms?: number
	bathrooms?: number
	sort_by?: string
	sort_order?: string
	limit?: number
	page?: number
	language?: string // Added language parameter
}

export async function getProperties(filter: PropertyFilter = {}) {
	try {
		const language = filter.language || 'hy' // Default to Armenian

		let query = `
      SELECT 
        p.id,
        p.custom_id,
        -- Language-specific title and description
        CASE 
          WHEN $1 = 'ru' THEN COALESCE(p.title_ru, p.title)
          WHEN $1 = 'en' THEN COALESCE(p.title_en, p.title)
          ELSE p.title
        END as title,
        CASE 
          WHEN $1 = 'ru' THEN COALESCE(p.description_ru, p.description)
          WHEN $1 = 'en' THEN COALESCE(p.description_en, p.description)
          ELSE p.description
        END as description,
        -- Original fields for admin/reference
        p.title as title_original,
        p.description as description_original,
        p.title_ru,
        p.title_en,
        p.description_ru,
        p.description_en,
        p.property_type,
        p.listing_type,
        p.price,
        p.currency,
        ps.name as status,
        ps.color as status_color,
        p.views,
        p.created_at,
        p.updated_at,
        p.state_id,
        p.city_id,
        p.address,
        p.translation_status,
        p.last_translated_at,
        s.name as state_name,
        c.name as city_name,
        -- Get state and city objects
        json_build_object('id', s.id, 'name', s.name) as state,
        json_build_object('id', c.id, 'name', c.name) as city,
        -- Get property attributes based on type
        CASE 
          WHEN p.property_type = 'house' THEN json_build_object(
            'bedrooms', ha.bedrooms,
            'bathrooms', ha.bathrooms,
            'area_sqft', ha.area_sqft,
            'lot_size_sqft', ha.lot_size_sqft,
            'floors', ha.floors
          )
          WHEN p.property_type = 'apartment' THEN json_build_object(
            'bedrooms', aa.bedrooms,
            'bathrooms', aa.bathrooms,
            'area_sqft', aa.area_sqft,
            'floor', aa.floor,
            'total_floors', aa.total_floors
          )
          WHEN p.property_type = 'commercial' THEN json_build_object(
            'business_type', ca.business_type,
            'area_sqft', ca.area_sqft,
            'floors', ca.floors,
            'ceiling_height', ca.ceiling_height
          )
          WHEN p.property_type = 'land' THEN json_build_object(
            'area_acres', la.area_acres
          )
        END as attributes,
        -- Get images
        (
          SELECT json_agg(json_build_object(
            'id', pm.id,
            'url', pm.url,
            'thumbnail_url', pm.thumbnail_url,
            'type', pm.type,
            'is_primary', pm.is_primary,
            'display_order', pm.display_order
          ) ORDER BY pm.is_primary DESC, pm.display_order, pm.created_at)
          FROM property_media pm
          WHERE pm.property_id = p.id
        ) as images,
        -- Get features
        (
          SELECT json_agg(json_build_object(
            'id', pf.id,
            'name', pf.name,
            'icon', pf.icon
          ))
          FROM property_features pf
          JOIN property_to_features ptf ON pf.id = ptf.feature_id
          WHERE ptf.property_id = p.id
        ) as features,
        -- Language metadata
        $1 as requested_language,
        CASE 
          WHEN $1 = 'ru' AND p.title_ru IS NOT NULL THEN 'translated'
          WHEN $1 = 'en' AND p.title_en IS NOT NULL THEN 'translated'
          WHEN $1 = 'hy' THEN 'original'
          ELSE 'fallback'
        END as language_status
      FROM properties p
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_statuses ps ON p.status = ps.id
      LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
      LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
      LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
      LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
      WHERE ps.is_active = true
    `

		const params = [language] // First parameter is always the language
		let paramIndex = 2 // Start from 2 since language is $1

		// Apply filters (adjust parameter indices)
		if (filter.property_type) {
			query += ` AND p.property_type = ${paramIndex}`
			params.push(filter.property_type)
			paramIndex++
		}

		if (filter.listing_type) {
			query += ` AND p.listing_type = ${paramIndex}`
			params.push(filter.listing_type)
			paramIndex++
		}

		if (filter.state_id) {
			query += ` AND p.state_id = ${paramIndex}`
			params.push(String(filter.state_id))
			paramIndex++
		}

		if (filter.city_id) {
			query += ` AND p.city_id = ${paramIndex}`
			params.push(String(filter.city_id))
			paramIndex++
		}

		if (filter.min_price) {
			query += ` AND p.price >= ${paramIndex}`
			params.push(String(filter.min_price))
			paramIndex++
		}

		if (filter.max_price) {
			query += ` AND p.price <= ${paramIndex}`
			params.push(String(filter.max_price))
			paramIndex++
		}

		if (
			filter.bedrooms &&
			(filter.property_type === 'house' ||
				filter.property_type === 'apartment' ||
				!filter.property_type)
		) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bedrooms >= ${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bedrooms >= ${paramIndex})
      )`
			params.push(String(filter.bedrooms))
			paramIndex++
		}

		if (
			filter.bathrooms &&
			(filter.property_type === 'house' ||
				filter.property_type === 'apartment' ||
				!filter.property_type)
		) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bathrooms >= ${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bathrooms >= ${paramIndex})
      )`
			params.push(String(filter.bathrooms))
			paramIndex++
		}

		// Sorting
		const sortBy = filter.sort_by || 'created_at'
		const sortOrder = filter.sort_order || 'desc'

		// Validate sort fields to prevent SQL injection
		const allowedSortFields = ['price', 'created_at', 'views', 'title']
		const safeSortBy = allowedSortFields.includes(sortBy)
			? sortBy
			: 'created_at'
		const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

		query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`

		// Pagination
		const limit = Math.min(filter.limit || 20, 100) // Max 100 items
		const offset = ((filter.page || 1) - 1) * limit
		query += ` LIMIT ${paramIndex} OFFSET ${paramIndex + 1}`
		params.push(String(limit), String(offset))

		console.log(`✅ Executing property query for language: ${language}`)
		const result = await sql.query(query, params)

		// Transform the result to match expected format
		return result.rows.map(row => ({
			...row,
			// Ensure arrays are properly formatted
			images: row.images || [],
			features: row.features || [],
			// Format attributes properly
			attributes: row.attributes || {},
		}))
	} catch (error) {
		console.error('Error fetching properties:', error)
		throw new Error('Failed to fetch properties')
	}
}

export async function checkStateUsesDistricts(
	stateId: number
): Promise<boolean> {
	try {
		const query = `
			SELECT uses_districts
			FROM states
			WHERE id = $1
		`

		const result = await sql.query(query, [stateId])
		return result.rows[0]?.uses_districts || false
	} catch (error) {
		console.error('Error checking state district usage:', error)
		return false
	}
}

export async function getDistrictsByState(stateId: number) {
	try {
		const query = `
			SELECT 
				d.id,
				d.name,
				d.name_hy,
				d.name_en,
				d.name_ru,
				d.state_id
			FROM districts d
			WHERE d.state_id = $1
			ORDER BY d.name_hy ASC
		`

		const result = await sql.query(query, [stateId])
		return result.rows
	} catch (error) {
		console.error('Error fetching districts:', error)
		throw new Error('Failed to fetch districts')
	}
}

export async function getPropertyByCustomId(customId: string, language = 'hy') {
	try {
		const query = `
			SELECT 
				p.*,
				-- Language-specific title and description
				CASE 
					WHEN $2 = 'ru' THEN COALESCE(p.title_ru, p.title)
					WHEN $2 = 'en' THEN COALESCE(p.title_en, p.title)
					ELSE p.title
				END as title_display,
				CASE 
					WHEN $2 = 'ru' THEN COALESCE(p.description_ru, p.description)
					WHEN $2 = 'en' THEN COALESCE(p.description_en, p.description)
					ELSE p.description
				END as description_display,
				ps.name as status,
				ps.color as status_color,
				s.name as state_name,
				s.uses_districts,
				c.name as city_name,
				d.name_hy as district_name,
				d.name_en as district_name_en,
				d.name_ru as district_name_ru,
				-- Get state, city, and district objects
				json_build_object('id', s.id, 'name', s.name, 'uses_districts', s.uses_districts) as state,
				CASE WHEN c.id IS NOT NULL THEN
					json_build_object('id', c.id, 'name', c.name)
				ELSE NULL END as city,
				CASE WHEN d.id IS NOT NULL THEN
					json_build_object(
						'id', d.id, 
						'name', d.name_hy, 
						'name_en', d.name_en, 
						'name_ru', d.name_ru
					)
				ELSE NULL END as district,
				-- Get property attributes
				CASE 
					WHEN p.property_type = 'house' THEN json_build_object(
						'bedrooms', ha.bedrooms,
						'bathrooms', ha.bathrooms,
						'area_sqft', ha.area_sqft,
						'lot_size_sqft', ha.lot_size_sqft,
						'floors', ha.floors
					)
					WHEN p.property_type = 'apartment' THEN json_build_object(
						'bedrooms', aa.bedrooms,
						'bathrooms', aa.bathrooms,
						'area_sqft', aa.area_sqft,
						'floor', aa.floor,
						'total_floors', aa.total_floors
					)
					WHEN p.property_type = 'commercial' THEN json_build_object(
						'business_type', ca.business_type,
						'area_sqft', ca.area_sqft,
						'floors', ca.floors,
						'ceiling_height', ca.ceiling_height
					)
					WHEN p.property_type = 'land' THEN json_build_object(
						'area_acres', la.area_acres
					)
				END as attributes,
				$2 as requested_language,
				CASE 
					WHEN $2 = 'ru' AND p.title_ru IS NOT NULL THEN 'translated'
					WHEN $2 = 'en' AND p.title_en IS NOT NULL THEN 'translated'
					WHEN $2 = 'hy' THEN 'original'
					ELSE 'fallback'
				END as language_status
			FROM properties p
			JOIN states s ON p.state_id = s.id
			LEFT JOIN cities c ON p.city_id = c.id
			LEFT JOIN districts d ON p.district_id = d.id
			LEFT JOIN property_statuses ps ON p.status = ps.id
			LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
			LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
			LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
			LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
			WHERE p.custom_id = $1 AND ps.is_active = true
		`

		const result = await sql.query(query, [customId, language])

		if (result.rows.length === 0) {
			return null
		}

		const property = result.rows[0]

		// Get images separately
		const imagesResult = await sql.query(
			`
			SELECT id, url, thumbnail_url, type, is_primary, display_order
			FROM property_media
			WHERE property_id = $1
			ORDER BY is_primary DESC, display_order, created_at
		`,
			[property.id]
		)

		// Get features separately
		const featuresResult = await sql.query(
			`
			SELECT pf.id, pf.name, pf.icon
			FROM property_features pf
			JOIN property_to_features ptf ON pf.id = ptf.feature_id
			WHERE ptf.property_id = $1
		`,
			[property.id]
		)

		// Use display fields for title and description
		const { title, description, title_display, description_display, ...rest } =
			property

		return {
			...rest,
			title: title_display,
			description: description_display,
			title_original: title,
			description_original: description,
			images: imagesResult.rows || [],
			features: featuresResult.rows || [],
			attributes: property.attributes || {},
		}
	} catch (error) {
		console.error('Error fetching property by custom ID:', error)
		throw new Error('Failed to fetch property')
	}
}

export async function getStates() {
	try {
		const query = `
			SELECT 
				s.id,
				s.name,
				s.uses_districts,
				COUNT(d.id) as district_count,
				COUNT(c.id) as city_count
			FROM states s
			LEFT JOIN districts d ON s.id = d.state_id
			LEFT JOIN cities c ON s.id = c.state_id
			GROUP BY s.id, s.name, s.uses_districts
			ORDER BY s.name ASC
		`

		const result = await sql.query(query)
		return result.rows
	} catch (error) {
		console.error('Error fetching states:', error)
		throw new Error('Failed to fetch states')
	}
}

export async function getCitiesByState(stateId: number) {
	try {
		const query = `
			SELECT id, name, state_id
			FROM cities
			WHERE state_id = $1
			ORDER BY name ASC
		`

		const result = await sql.query(query, [stateId])
		return result.rows
	} catch (error) {
		console.error('Error fetching cities:', error)
		throw new Error('Failed to fetch cities')
	}
}

export async function getPropertyFeatures() {
	try {
		const query = `
			SELECT id, name, icon
			FROM property_features
			ORDER BY name ASC
		`

		const result = await sql.query(query)
		return result.rows
	} catch (error) {
		console.error('Error fetching property features:', error)
		throw new Error('Failed to fetch property features')
	}
}

export async function getRecentProperties(limit = 8, language = 'hy') {
	try {
		// Reuse the existing getProperties function with sorting, limit, and language
		const recentProperties = await getProperties({
			sort_by: 'created_at',
			sort_order: 'desc',
			limit: limit,
			language: language,
		})

		return recentProperties
	} catch (error) {
		console.error('Error fetching recent properties:', error)
		throw new Error('Failed to fetch recent properties')
	}
}

// Helper function to increment property views
export async function incrementPropertyViews(
	propertyId: number,
	userId: number | null = null,
	ipAddress: string | null = null
) {
	try {
		// Insert view record
		await sql.query(
			`
			INSERT INTO property_views (property_id, user_id, ip_address, viewed_at)
			VALUES ($1, $2, $3, NOW())
		`,
			[propertyId, userId, ipAddress]
		)

		// Increment views counter
		await sql.query(
			`
			UPDATE properties 
			SET views = views + 1 
			WHERE id = $1
		`,
			[propertyId]
		)

		return true
	} catch (error) {
		console.error('Error incrementing property views:', error)
		return false
	}
}

// New function to get supported languages
export async function getSupportedLanguages() {
	try {
		const query = `
			SELECT code, name, native_name, is_default, is_active, sort_order
			FROM supported_languages
			WHERE is_active = true
			ORDER BY sort_order, name ASC
		`

		const result = await sql.query(query)
		return result.rows
	} catch (error) {
		console.error('Error fetching supported languages:', error)
		throw new Error('Failed to fetch supported languages')
	}
}

// New function to get translation statistics
export async function getTranslationStats() {
	try {
		const query = `
			SELECT 
				COUNT(*) as total_properties,
				COUNT(CASE WHEN title_ru IS NOT NULL AND title_en IS NOT NULL THEN 1 END) as fully_translated,
				COUNT(CASE WHEN title_ru IS NOT NULL OR title_en IS NOT NULL THEN 1 END) as partially_translated,
				COUNT(CASE WHEN title_ru IS NULL AND title_en IS NULL THEN 1 END) as not_translated,
				COUNT(CASE WHEN translation_status = 'completed' THEN 1 END) as completed_translations,
				COUNT(CASE WHEN translation_status = 'failed' THEN 1 END) as failed_translations,
				COUNT(CASE WHEN translation_status = 'pending' THEN 1 END) as pending_translations
			FROM properties
		`

		const result = await sql.query(query)
		return result.rows[0]
	} catch (error) {
		console.error('Error fetching translation stats:', error)
		throw new Error('Failed to fetch translation stats')
	}
}
