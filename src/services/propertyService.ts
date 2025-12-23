// src/services/propertyService.ts - COMPLETE FIXED VERSION
import { query } from '@/lib/db'

// Define a type for the filter parameter
type PropertyFilter = {
	property_type?: string
	listing_type?: string
	state_id?: number
	city_id?: number
	district_id?: number
	min_price?: number
	max_price?: number
	bedrooms?: number
	bathrooms?: number
	sort_by?: string
	sort_order?: string
	limit?: number
	page?: number
	language?: string // Added language parameter
	show_hidden?: boolean // Whether to show hidden properties
	is_hidden?: boolean // Filter by hidden status
	is_exclusive?: boolean // Filter by exclusive status
	address_admin?: string // Admin address filter
	is_top?: boolean // Filter by top properties
	is_urgently?: boolean // Filter by urgent properties
	building_type_id?: number // For apartments
	business_type_id?: number // For commercial properties
}

export async function getProperties(filter: PropertyFilter = {}) {
	try {
		const language = filter.language || 'hy' // Default to Armenian

		// ✅ FIXED: Proper SQL query syntax with correct comma placement
		let queryText = `
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
				p.title as title_original,
				p.description as description_original,
				p.title_ru,
				p.title_en,
				p.description_ru,
				p.description_en,
				p.property_type,
				p.listing_type,
				p.is_hidden,
				p.is_exclusive,
				p.is_top,
				p.is_urgently,
				p.price,
				p.currency,
				ps.name as status,
				ps.color as status_color,
				p.views,
				p.created_at,
				p.updated_at,
				p.state_id,
				p.city_id,
				p.district_id,
				p.address,
				p.latitude,
				p.longitude,
				p.translation_status,
				p.last_translated_at,
				s.name as state_name,
				CASE 
					WHEN c.id IS NOT NULL THEN c.name
					WHEN d.id IS NOT NULL THEN 'Երևան'
					ELSE 'Անհայտ քաղաք'
				END as city_name,
				d.name_hy as district_name,
				-- Get state and city objects
				json_build_object('id', s.id, 'name', s.name, 'uses_districts', s.uses_districts) as state,
				CASE 
					WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name)
					WHEN d.id IS NOT NULL THEN json_build_object('id', 1, 'name', 'Երևան')
					ELSE NULL
				END as city,
				CASE 
					WHEN d.id IS NOT NULL THEN json_build_object(
						'id', d.id, 
						'name_hy', d.name_hy, 
						'name_en', d.name_en, 
						'name_ru', d.name_ru
					)
					ELSE NULL
				END as district,
				-- Get property attributes based on type
				CASE 
					WHEN p.property_type = 'house' THEN json_build_object(
						'bedrooms', ha.bedrooms,
						'bathrooms', ha.bathrooms,
						'area_sqft', ha.area_sqft,
						'lot_size_sqft', ha.lot_size_sqft,
						'floors', ha.floors,
						'ceiling_height', ha.ceiling_height
					)
					WHEN p.property_type = 'apartment' THEN json_build_object(
						'bedrooms', aa.bedrooms,
						'bathrooms', aa.bathrooms,
						'area_sqft', aa.area_sqft,
						'floor', aa.floor,
						'total_floors', aa.total_floors,
						'ceiling_height', aa.ceiling_height,
						'building_type_id', aa.building_type_id,
						'building_type', CASE 
						WHEN abt.id IS NOT NULL THEN json_build_object(
							'id', abt.id,
						'name_hy', abt.name_hy,
							'name_en', abt.name_en,
						'name_ru', abt.name_ru
							)
						ELSE NULL
						END
						)
					
					WHEN p.property_type = 'commercial' THEN json_build_object(
						'business_type', ca.business_type,
						'business_type_id', ca.business_type_id,
						'business_type_info', CASE 
						WHEN cbt.id IS NOT NULL THEN json_build_object(
						'id', cbt.id,
						'name_hy', cbt.name_hy,
						'name_en', cbt.name_en,
						'name_ru', cbt.name_ru
						)
						ELSE NULL
						END,
						'area_sqft', ca.area_sqft,
						'floors', ca.floors,
						'ceiling_height', ca.ceiling_height,
						'rooms', ca.rooms
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
			LEFT JOIN cities c ON p.city_id = c.id
			LEFT JOIN districts d ON p.district_id = d.id
			LEFT JOIN property_statuses ps ON p.status = ps.id
			LEFT JOIN apartment_building_types abt ON aa.building_type_id = abt.id
			LEFT JOIN commercial_business_types cbt ON ca.business_type_id = cbt.id
			LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
			LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
			LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
			LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
			WHERE (ps.is_active = true OR ps.id IS NULL)
		`

		const params = [language] // First parameter is always the language
		let paramIndex = 2 // Start from 2 since language is $1

		// Apply filters (adjust parameter indices)
		if (filter.property_type) {
			queryText += ` AND p.property_type = $${paramIndex}`
			params.push(filter.property_type)
			paramIndex++
		}

		if (filter.listing_type) {
			queryText += ` AND p.listing_type = $${paramIndex}`
			params.push(filter.listing_type)
			paramIndex++
		}

		if (filter.state_id) {
			queryText += ` AND p.state_id = $${paramIndex}`
			params.push(String(filter.state_id))
			paramIndex++
		}

		if (filter.city_id) {
			queryText += ` AND p.city_id = $${paramIndex}`
			params.push(String(filter.city_id))
			paramIndex++
		}

		if (filter.district_id) {
			queryText += ` AND p.district_id = $${paramIndex}`
			params.push(String(filter.district_id))
			paramIndex++
		}

		if (filter.min_price) {
			queryText += ` AND p.price >= $${paramIndex}`
			params.push(String(filter.min_price))
			paramIndex++
		}

		if (filter.max_price) {
			queryText += ` AND p.price <= $${paramIndex}`
			params.push(String(filter.max_price))
			paramIndex++
		}

		if (
			filter.bedrooms &&
			(filter.property_type === 'house' ||
				filter.property_type === 'apartment' ||
				!filter.property_type)
		) {
			queryText += ` AND (
				(p.property_type = 'house' AND ha.bedrooms >= $${paramIndex}) OR
				(p.property_type = 'apartment' AND aa.bedrooms >= $${paramIndex})
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
			queryText += ` AND (
				(p.property_type = 'house' AND ha.bathrooms >= $${paramIndex}) OR
				(p.property_type = 'apartment' AND aa.bathrooms >= $${paramIndex})
			)`
			params.push(String(filter.bathrooms))
			paramIndex++
		}

		if (filter.show_hidden !== true) {
			queryText += ` AND p.is_hidden = false`
		}

		if (filter.building_type_id && filter.property_type === 'apartment') {
			queryText += ` AND aa.building_type_id = $${paramIndex}`
			params.push(String(filter.building_type_id))
			paramIndex++
		}

		// Filter by business type (commercial only)
		if (filter.business_type_id && filter.property_type === 'commercial') {
			queryText += ` AND ca.business_type_id = $${paramIndex}`
			params.push(String(filter.business_type_id))
			paramIndex++
		}

		// Filter by hidden status if specified
		if (filter.is_hidden !== undefined) {
			queryText += ` AND p.is_hidden = $${paramIndex}`
			params.push(String(filter.is_hidden))
			paramIndex++
		}

		if (filter.is_top) {
			queryText += ` AND p.is_top = true`
		}

		// Filter by urgent properties
		if (filter.is_urgently) {
			queryText += ` AND p.is_urgently = true`
		}

		// Filter by exclusive status if specified
		if (filter.is_exclusive !== undefined) {
			queryText += ` AND p.is_exclusive = $${paramIndex}`
			params.push(String(filter.is_exclusive))
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

		queryText += ` ORDER BY p.is_top DESC, 
	p.is_urgently DESC, p.is_exclusive DESC, p.${safeSortBy} ${safeSortOrder}`


		// Pagination
		const limit = Math.min(filter.limit || 20, 100) // Max 100 items
		const offset = ((filter.page || 1) - 1) * limit
		queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
		params.push(String(limit), String(offset))

		console.log(`✅ Executing property query for language: ${language}`)
		const result = await query(queryText, params)

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
		const queryText = `
			SELECT uses_districts
			FROM states
			WHERE id = $1
		`

		const result = await query(queryText, [stateId])
		return result.rows[0]?.uses_districts || false
	} catch (error) {
		console.error('Error checking state district usage:', error)
		return false
	}
}

export async function getDistrictsByState(stateId: number) {
	try {
		const queryText = `
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

		const result = await query(queryText, [stateId])
		return result.rows
	} catch (error) {
		console.error('Error fetching districts:', error)
		throw new Error('Failed to fetch districts')
	}
}

export async function getPropertyByCustomId(
	customId: string,
	language = 'hy',
	includeHidden = false
) {
	try {
		const queryText = `
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
				CASE 
					WHEN c.id IS NOT NULL THEN c.name
					WHEN d.id IS NOT NULL THEN 'Երևան'
					ELSE 'Անհայտ քաղաք'
				END as city_name,
				d.name_hy as district_name,
				d.name_en as district_name_en,
				d.name_ru as district_name_ru,
				-- Get state, city, and district objects
				json_build_object('id', s.id, 'name', s.name, 'uses_districts', s.uses_districts) as state,
				CASE 
					WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name)
					WHEN d.id IS NOT NULL THEN json_build_object('id', 1, 'name', 'Երևան')
					ELSE NULL
				END as city,
				CASE 
					WHEN d.id IS NOT NULL THEN json_build_object(
						'id', d.id, 
						'name', d.name_hy, 
						'name_en', d.name_en, 
						'name_ru', d.name_ru
					)
					ELSE NULL
				END as district,
				-- Get property attributes
				CASE 
					WHEN p.property_type = 'house' THEN json_build_object(
						'bedrooms', ha.bedrooms,
						'bathrooms', ha.bathrooms,
						'area_sqft', ha.area_sqft,
						'lot_size_sqft', ha.lot_size_sqft,
						'floors', ha.floors,
						'ceiling_height', ha.ceiling_height
					)
					WHEN p.property_type = 'apartment' THEN json_build_object(
						'bedrooms', aa.bedrooms,
						'bathrooms', aa.bathrooms,
						'area_sqft', aa.area_sqft,
						'floor', aa.floor,
						'total_floors', aa.total_floors,
						'ceiling_height', aa.ceiling_height,
						'building_type_id', aa.building_type_id,
						'building_type', CASE 
						WHEN abt.id IS NOT NULL THEN json_build_object(
						'id', abt.id,
						'name_hy', abt.name_hy,
						'name_en', abt.name_en,
						'name_ru', abt.name_ru
							)
						ELSE NULL
						END
					)
					WHEN p.property_type = 'commercial' THEN json_build_object(
						'business_type', ca.business_type,
						'business_type_id', ca.business_type_id,
						'business_type_info', CASE 
						WHEN cbt.id IS NOT NULL THEN json_build_object(
						'id', cbt.id,
						'name_hy', cbt.name_hy,
						'name_en', cbt.name_en,
						'name_ru', cbt.name_ru
						)
						ELSE NULL
						END,
						'area_sqft', ca.area_sqft,
						'floors', ca.floors,
						'ceiling_height', ca.ceiling_height,
						'rooms', ca.rooms
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
			LEFT JOIN apartment_attributes aa 
  			ON p.id = aa.property_id AND p.property_type = 'apartment'
			LEFT JOIN apartment_building_types abt 
  			ON aa.building_type_id = abt.id
			LEFT JOIN commercial_attributes ca 
  			ON p.id = ca.property_id AND p.property_type = 'commercial'
			LEFT JOIN commercial_business_types cbt 
  			ON ca.business_type_id = cbt.id
			LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
			LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
			WHERE p.custom_id = $1 AND (ps.is_active = true OR ps.id IS NULL)
			${!includeHidden ? 'AND p.is_hidden = false' : ''}
		`

		const result = await query(queryText, [customId, language])

		if (result.rows.length === 0) {
			return null
		}

		const property = result.rows[0]

		if (property.is_hidden && !includeHidden) {
			return null
		}

		// Get images separately
		const imagesResult = await query(
			`
			SELECT id, url, thumbnail_url, type, is_primary, display_order
			FROM property_media
			WHERE property_id = $1
			ORDER BY is_primary DESC, display_order, created_at
		`,
			[property.id]
		)

		// Get features separately
		const featuresResult = await query(
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
		const queryText = `
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

		const result = await query(queryText)
		return result.rows
	} catch (error) {
		console.error('Error fetching states:', error)
		throw new Error('Failed to fetch states')
	}
}

export async function getCitiesByState(stateId: number) {
	try {
		const queryText = `
			SELECT id, name, state_id
			FROM cities
			WHERE state_id = $1
			ORDER BY name ASC
		`

		const result = await query(queryText, [stateId])
		return result.rows
	} catch (error) {
		console.error('Error fetching cities:', error)
		throw new Error('Failed to fetch cities')
	}
}

export async function getPropertyFeatures() {
	try {
		const queryText = `
			SELECT id, name, icon
			FROM property_features
			ORDER BY name ASC
		`

		const result = await query(queryText)
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
		// Check if this IP already viewed this property in the last hour
		const recentViewCheck = await query(
			`
			SELECT id FROM property_views 
			WHERE property_id = $1 
			AND ip_address = $2 
			AND viewed_at > NOW() - INTERVAL '1 hour'
			LIMIT 1
		`,
			[propertyId, ipAddress || 'unknown']
		)

		// If there's a recent view from this IP, don't count it again
		if (recentViewCheck.rows.length > 0) {
			console.log(
				`Duplicate view prevented for property ${propertyId} from IP ${ipAddress}`
			)
			return false
		}

		// Insert view record
		await query(
			`
			INSERT INTO property_views (property_id, user_id, ip_address, viewed_at)
			VALUES ($1, $2, $3, NOW())
		`,
			[propertyId, userId, ipAddress || 'unknown']
		)

		// Increment views counter
		await query(
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
		const queryText = `
			SELECT code, name, native_name, is_default, is_active, sort_order
			FROM supported_languages
			WHERE is_active = true
			ORDER BY sort_order, name ASC
		`

		const result = await query(queryText)
		return result.rows
	} catch (error) {
		console.error('Error fetching supported languages:', error)
		throw new Error('Failed to fetch supported languages')
	}
}

// New function to get translation statistics
export async function getTranslationStats() {
	try {
		const queryText = `
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

		const result = await query(queryText)
		return result.rows[0]
	} catch (error) {
		console.error('Error fetching translation stats:', error)
		throw new Error('Failed to fetch translation stats')
	}
}


export async function togglePropertyVisibility(
	propertyId: number,
	isHidden: boolean
) {
	try {
		const result = await query(
			`UPDATE properties SET is_hidden = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_hidden`,
			[isHidden, propertyId]
		)

		if (result.rows.length === 0) {
			throw new Error('Property not found')
		}

		return result.rows[0]
	} catch (error) {
		console.error('Error toggling property visibility:', error)
		throw new Error('Failed to update property visibility')
	}
}

export async function togglePropertyExclusive(
	propertyId: number,
	isExclusive: boolean
) {
	try {
		const result = await query(
			`UPDATE properties SET is_exclusive = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_exclusive`,
			[isExclusive, propertyId]
		)

		if (result.rows.length === 0) {
			throw new Error('Property not found')
		}

		return result.rows[0]
	} catch (error) {
		console.error('Error toggling property exclusive status:', error)
		throw new Error('Failed to update property exclusive status')
	}
}

// ✅ Get visibility statistics for admin dashboard
export async function getVisibilityStats() {
	try {
		const result = await query(`
			SELECT 
				COUNT(*) as total_properties,
				COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_properties,
				COUNT(CASE WHEN is_hidden = false THEN 1 END) as public_properties,
				COUNT(CASE WHEN is_exclusive = true THEN 1 END) as exclusive_properties,
				COUNT(CASE WHEN is_exclusive = false THEN 1 END) as regular_properties,
				COUNT(CASE WHEN is_hidden = false AND is_exclusive = true THEN 1 END) as public_exclusive_properties
			FROM properties
		`)

		return result.rows[0]
	} catch (error) {
		console.error('Error fetching visibility stats:', error)
		throw new Error('Failed to fetch visibility statistics')
	}
}

export async function getApartmentBuildingTypes() {
	try {
		const result = await query(`
			SELECT id, name_hy, name_en, name_ru, is_active, sort_order
			FROM apartment_building_types
			WHERE is_active = true
			ORDER BY sort_order, name_hy ASC
		`)
		return result.rows
	} catch (error) {
		console.error('Error fetching apartment building types:', error)
		throw new Error('Failed to fetch apartment building types')
	}
}

export async function getCommercialBusinessTypes() {
	try {
		const result = await query(`
			SELECT id, name_hy, name_en, name_ru, is_active, sort_order
			FROM commercial_business_types
			WHERE is_active = true
			ORDER BY sort_order, name_hy ASC
		`)
		return result.rows
	} catch (error) {
		console.error('Error fetching commercial business types:', error)
		throw new Error('Failed to fetch commercial business types')
	}
}

export async function togglePropertyTop(propertyId: number, isTop: boolean) {
	try {
		const result = await query(
			`UPDATE properties SET is_top = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_top`,
			[isTop, propertyId]
		)

		if (result.rows.length === 0) {
			throw new Error('Property not found')
		}

		return result.rows[0]
	} catch (error) {
		console.error('Error toggling property top status:', error)
		throw new Error('Failed to update property top status')
	}
}

export async function togglePropertyUrgently(
	propertyId: number,
	isUrgently: boolean
) {
	try {
		const result = await query(
			`UPDATE properties SET is_urgently = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_urgently`,
			[isUrgently, propertyId]
		)

		if (result.rows.length === 0) {
			throw new Error('Property not found')
		}

		return result.rows[0]
	} catch (error) {
		console.error('Error toggling property urgently status:', error)
		throw new Error('Failed to update property urgently status')
	}
}