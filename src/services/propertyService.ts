// src/services/propertyService.ts - Fixed version
import { sql } from '@vercel/postgres'

// Define a type for the filter parameter
type PropertyFilter = {
	property_type?: string
	listing_type?: string
	featured?: boolean
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
}

export async function getProperties(filter: PropertyFilter = {}) {
	try {
		let query = `
      SELECT 
        p.id,
        p.custom_id,
        p.title,
        p.description,
        p.property_type,
        p.listing_type,
        p.price,
        p.currency,
        ps.name as status, -- ✅ Get status name from property_statuses
        ps.display_name as status_display,
        ps.display_name_armenian as status_armenian,
        ps.color as status_color,
        p.featured,
        p.views,
        p.created_at,
        p.updated_at,
        p.state_id,
        p.city_id,
        p.address,
        s.name as state_name,
        c.name as city_name,
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
        ) as features
      FROM properties p
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_statuses ps ON p.status = ps.id -- ✅ Join to get status info
      LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
      LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
      LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
      LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
      WHERE ps.name = 'available' AND ps.is_active = true -- ✅ Only show available and active statuses
    `

		const params = []
		let paramIndex = 1

		// Apply filters
		if (filter.property_type) {
			query += ` AND p.property_type = $${paramIndex}`
			params.push(filter.property_type)
			paramIndex++
		}

		if (filter.listing_type) {
			query += ` AND p.listing_type = $${paramIndex}`
			params.push(filter.listing_type)
			paramIndex++
		}

		if (filter.featured !== undefined) {
			query += ` AND p.featured = $${paramIndex}`
			params.push(filter.featured)
			paramIndex++
		}

		if (filter.state_id) {
			query += ` AND p.state_id = $${paramIndex}`
			params.push(filter.state_id)
			paramIndex++
		}

		if (filter.city_id) {
			query += ` AND p.city_id = $${paramIndex}`
			params.push(filter.city_id)
			paramIndex++
		}

		if (filter.min_price) {
			query += ` AND p.price >= $${paramIndex}`
			params.push(filter.min_price)
			paramIndex++
		}

		if (filter.max_price) {
			query += ` AND p.price <= $${paramIndex}`
			params.push(filter.max_price)
			paramIndex++
		}

		// ✅ REMOVED status filter here since we're already filtering for 'available' in the base query
		// If you need to allow different status filters for admin, you can add a separate function

		// Property-specific filters
		if (filter.bedrooms && (filter.property_type === 'house' || filter.property_type === 'apartment' || !filter.property_type)) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bedrooms >= $${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bedrooms >= $${paramIndex})
      )`
			params.push(filter.bedrooms)
			paramIndex++
		}

		if (filter.bathrooms && (filter.property_type === 'house' || filter.property_type === 'apartment' || !filter.property_type)) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bathrooms >= $${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bathrooms >= $${paramIndex})
      )`
			params.push(filter.bathrooms)
			paramIndex++
		}

		// Sorting
		const sortBy = filter.sort_by || 'created_at'
		const sortOrder = filter.sort_order || 'desc'
		
		// Validate sort fields to prevent SQL injection
		const allowedSortFields = ['price', 'created_at', 'views', 'title']
		const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
		const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'
		
		query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`

		// Pagination
		const limit = Math.min(filter.limit || 20, 100) // Max 100 items
		const offset = ((filter.page || 1) - 1) * limit
		query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
		params.push(limit, offset)

		console.log('Executing property query with params:', params.length)
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

export async function getPropertyByCustomId(customId: string) {
	try {
		const query = `
      SELECT 
        p.*,
        ps.name as status, -- ✅ Get status name
        ps.display_name as status_display,
        ps.display_name_armenian as status_armenian,
        ps.color as status_color,
        s.name as state_name,
        c.name as city_name,
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
        END as attributes
      FROM properties p
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_statuses ps ON p.status = ps.id -- ✅ Join to get status
      LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
      LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
      LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
      LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
      WHERE p.custom_id = $1 AND ps.name = 'available' AND ps.is_active = true -- ✅ Filter by status name
    `

		const result = await sql.query(query, [customId])
		
		if (result.rows.length === 0) {
			return null
		}

		const property = result.rows[0]

		// Get images separately
		const imagesResult = await sql.query(`
			SELECT id, url, thumbnail_url, type, is_primary, display_order
			FROM property_media
			WHERE property_id = $1
			ORDER BY is_primary DESC, display_order, created_at
		`, [property.id])

		// Get features separately  
		const featuresResult = await sql.query(`
			SELECT pf.id, pf.name, pf.icon
			FROM property_features pf
			JOIN property_to_features ptf ON pf.id = ptf.feature_id
			WHERE ptf.property_id = $1
		`, [property.id])

		return {
			...property,
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
			SELECT id, name
			FROM states
			ORDER BY name ASC
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


export async function getFeaturedProperties() {
	try {
		// Reuse the existing getProperties function with featured filter
		const featuredProperties = await getProperties({
			featured: true,
			limit: 6
		})
		
		return featuredProperties
	} catch (error) {
		console.error('Error fetching featured properties:', error)
		throw new Error('Failed to fetch featured properties')
	}
}

export async function getRecentProperties(limit = 8) {
	try {
		// Reuse the existing getProperties function with sorting and limit
		const recentProperties = await getProperties({
			sort_by: 'created_at',
			sort_order: 'desc',
			limit: limit
		})
		
		return recentProperties
	} catch (error) {
		console.error('Error fetching recent properties:', error)
		throw new Error('Failed to fetch recent properties')
	}
}

// Helper function to increment property views
export async function incrementPropertyViews(propertyId: number, userId: number | null = null, ipAddress: string | null = null) {
	try {
		// Insert view record
		await sql.query(`
			INSERT INTO property_views (property_id, user_id, ip_address, viewed_at)
			VALUES ($1, $2, $3, NOW())
		`, [propertyId, userId, ipAddress])

		// Increment views counter
		await sql.query(`
			UPDATE properties 
			SET views = views + 1 
			WHERE id = $1
		`, [propertyId])

		return true
	} catch (error) {
		console.error('Error incrementing property views:', error)
		return false
	}
}