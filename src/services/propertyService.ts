// // src/services/propertyService.ts
// import { sql } from '@vercel/postgres'
// import {
//   ListingType,
// 	Property,
// 	PropertyFilter,
//   PropertyType,
// } from '@/types/property'


// export async function getProperties(filter: PropertyFilter) {
// 	try {
// 		let query = `
//       SELECT 
//         p.*,
//         s.name as state_name,
//         s.code as state_code,
//         c.name as city_name,
//         u.email as user_email,
//         u.phone as user_phone,
//         CASE 
//           WHEN p.property_type = 'house' THEN json_build_object(
//             'bedrooms', ha.bedrooms,
//             'bathrooms', ha.bathrooms,
//             'area_sqft', ha.area_sqft,
//             'lot_size_sqft', ha.lot_size_sqft,
//             'floors', ha.floors
//           )
//           WHEN p.property_type = 'apartment' THEN json_build_object(
//             'bedrooms', aa.bedrooms,
//             'bathrooms', aa.bathrooms,
//             'area_sqft', aa.area_sqft,
//             'floor', aa.floor,
//             'total_floors', aa.total_floors
//           )
//           WHEN p.property_type = 'commercial' THEN json_build_object(
//             'business_type', ca.business_type,
//             'area_sqft', ca.area_sqft,
//             'floors', ca.floors
//           )
//           WHEN p.property_type = 'land' THEN json_build_object(
//             'area_acres', la.area_acres
//           )
//         END as attributes,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pm.id,
//             'url', pm.url,
//             'thumbnail_url', pm.thumbnail_url,
//             'type', pm.type,
//             'is_primary', pm.is_primary,
//             'display_order', pm.display_order
//           ) ORDER BY pm.display_order, pm.created_at)
//           FROM property_media pm
//           WHERE pm.property_id = p.id
//         ) as images,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pf.id,
//             'name', pf.name,
//             'icon', pf.icon
//           ))
//           FROM property_features pf
//           JOIN property_to_features ptf ON pf.id = ptf.feature_id
//           WHERE ptf.property_id = p.id
//         ) as features
//       FROM properties p
//       JOIN states s ON p.state_id = s.id
//       JOIN cities c ON p.city_id = c.id
//       JOIN users u ON p.user_id = u.id
//       LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
//       LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
//       LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
//       LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
//       WHERE 1=1
//     `

// 		const params: (PropertyType | ListingType | number | string | string[])[] =
// 			[]
// 		let paramIndex = 1

// 		// Apply filters
// 		if (filter.property_type) {
// 			query += ` AND p.property_type = $${paramIndex}`
// 			params.push(filter.property_type)
// 			paramIndex++
// 		}

// 		if (filter.listing_type) {
// 			query += ` AND p.listing_type = $${paramIndex}`
// 			params.push(filter.listing_type)
// 			paramIndex++
// 		}

// 		if (filter.state_id) {
// 			query += ` AND p.state_id = $${paramIndex}`
// 			params.push(filter.state_id)
// 			paramIndex++
// 		}

// 		if (filter.city_id) {
// 			query += ` AND p.city_id = $${paramIndex}`
// 			params.push(filter.city_id)
// 			paramIndex++
// 		}

// 		if (filter.min_price) {
// 			query += ` AND p.price >= $${paramIndex}`
// 			params.push(filter.min_price)
// 			paramIndex++
// 		}

// 		if (filter.max_price) {
// 			query += ` AND p.price <= $${paramIndex}`
// 			params.push(filter.max_price)
// 			paramIndex++
// 		}

// 		// Apply property-specific filters
// 		if (
// 			filter.bedrooms &&
// 			(filter.property_type === 'house' || filter.property_type === 'apartment')
// 		) {
// 			query += ` AND (
//         (p.property_type = 'house' AND ha.bedrooms >= $${paramIndex}) OR
//         (p.property_type = 'apartment' AND aa.bedrooms >= $${paramIndex})
//       )`
// 			params.push(filter.bedrooms)
// 			paramIndex++
// 		}

// 		if (
// 			filter.bathrooms &&
// 			(filter.property_type === 'house' || filter.property_type === 'apartment')
// 		) {
// 			query += ` AND (
//         (p.property_type = 'house' AND ha.bathrooms >= $${paramIndex}) OR
//         (p.property_type = 'apartment' AND aa.bathrooms >= $${paramIndex})
//       )`
// 			params.push(filter.bathrooms)
// 			paramIndex++
// 		}

// 		// Apply feature filters
// 		if (filter.features && filter.features.length > 0) {
// 			query += ` AND p.id IN (
//         SELECT property_id 
//         FROM property_to_features 
//         WHERE feature_id = ANY($${paramIndex})
//         GROUP BY property_id 
//         HAVING COUNT(DISTINCT feature_id) = ${filter.features.length}
//       )`
// 			params.push(filter.features.map(String))
// 			paramIndex++
// 		}

// 		// Apply sorting
// 		const sortBy = filter.sort_by || 'created_at'
// 		const sortOrder = filter.sort_order || 'desc'
// 		query += ` ORDER BY p.${sortBy} ${sortOrder}`

// 		// Apply pagination
// 		const limit = filter.limit || 20
// 		const offset = ((filter.page || 1) - 1) * limit
// 		query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
// 		params.push(limit, offset)

// 		const result = await sql.query(query, params)
// 		return result.rows
// 	} catch (error) {
// 		console.error('Error fetching properties:', error)
// 		throw error
// 	}
// }

// // src/services/propertyService.ts - Add new function to get property by custom ID

// export async function getPropertyByCustomId(
// 	customId: string
// ): Promise<Property | null> {
// 	try {
// 		const query = `
//       SELECT 
//         p.*,
//         s.name as state_name,
//         s.code as state_code,
//         c.name as city_name,
//         u.email as user_email,
//         u.phone as user_phone,
//         u.is_agent as user_is_agent,
//         u.agency_name as user_agency_name,
//         CASE 
//           WHEN p.property_type = 'house' THEN json_build_object(
//             'bedrooms', ha.bedrooms,
//             'bathrooms', ha.bathrooms,
//             'area_sqft', ha.area_sqft,
//             'lot_size_sqft', ha.lot_size_sqft,
//             'floors', ha.floors
//           )
//           WHEN p.property_type = 'apartment' THEN json_build_object(
//             'bedrooms', aa.bedrooms,
//             'bathrooms', aa.bathrooms,
//             'area_sqft', aa.area_sqft,
//             'floor', aa.floor,
//             'total_floors', aa.total_floors
//           )
//           WHEN p.property_type = 'commercial' THEN json_build_object(
//             'business_type', ca.business_type,
//             'area_sqft', ca.area_sqft,
//             'floors', ca.floors
//           )
//           WHEN p.property_type = 'land' THEN json_build_object(
//             'area_acres', la.area_acres
//           )
//         END as attributes,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pm.id,
//             'url', pm.url,
//             'thumbnail_url', pm.thumbnail_url,
//             'type', pm.type,
//             'is_primary', pm.is_primary,
//             'display_order', pm.display_order
//           ) ORDER BY pm.display_order, pm.created_at)
//           FROM property_media pm
//           WHERE pm.property_id = p.id
//         ) as images,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pf.id,
//             'name', pf.name,
//             'icon', pf.icon
//           ))
//           FROM property_features pf
//           JOIN property_to_features ptf ON pf.id = ptf.feature_id
//           WHERE ptf.property_id = p.id
//         ) as features
//       FROM properties p
//       JOIN states s ON p.state_id = s.id
//       JOIN cities c ON p.city_id = c.id
//       JOIN users u ON p.user_id = u.id
//       LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
//       LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
//       LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
//       LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
//       WHERE p.custom_id = $1
//     `

// 		const result = await sql.query(query, [customId])
// 		return result.rows[0] || null
// 	} catch (error) {
// 		console.error('Error fetching property by custom id:', error)
// 		throw error
// 	}
// }

// export async function getPropertyById(id: number): Promise<Property | null> {
//   try {
//     const query = `
//       SELECT 
//         p.*,
//         s.name as state_name,
//         s.code as state_code,
//         c.name as city_name,
//         u.email as user_email,
//         u.phone as user_phone,
//         u.is_agent as user_is_agent,
//         u.agency_name as user_agency_name,
//         CASE 
//           WHEN p.property_type = 'house' THEN json_build_object(
//             'bedrooms', ha.bedrooms,
//             'bathrooms', ha.bathrooms,
//             'area_sqft', ha.area_sqft,
//             'lot_size_sqft', ha.lot_size_sqft,
//             'floors', ha.floors
//           )
//           WHEN p.property_type = 'apartment' THEN json_build_object(
//             'bedrooms', aa.bedrooms,
//             'bathrooms', aa.bathrooms,
//             'area_sqft', aa.area_sqft,
//             'floor', aa.floor,
//             'total_floors', aa.total_floors
//           )
//           WHEN p.property_type = 'commercial' THEN json_build_object(
//             'business_type', ca.business_type,
//             'area_sqft', ca.area_sqft,
//             'floors', ca.floors
//           )
//           WHEN p.property_type = 'land' THEN json_build_object(
//             'area_acres', la.area_acres
//           )
//         END as attributes,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pi.id,
//             'url', pi.url,
//             'caption', pi.caption,
//             'is_primary', pi.is_primary,
//             'display_order', pi.display_order
//           ) ORDER BY pi.display_order)
//           FROM property_images pi
//           WHERE pi.property_id = p.id
//         ) as images,
//         (
//           SELECT json_agg(json_build_object(
//             'id', pf.id,
//             'name', pf.name,
//             'icon', pf.icon
//           ))
//           FROM property_features pf
//           JOIN property_to_features ptf ON pf.id = ptf.feature_id
//           WHERE ptf.property_id = p.id
//         ) as features
//       FROM properties p
//       JOIN states s ON p.state_id = s.id
//       JOIN cities c ON p.city_id = c.id
//       JOIN users u ON p.user_id = u.id
//       LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
//       LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
//       LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
//       LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
//       WHERE p.id = $1
//     `

//     const result = await sql.query(query, [id])
//     return result.rows[0] || null
//   } catch (error) {
//     console.error('Error fetching property by id:', error)
//     throw error
//   }
// }

// export async function getStates() {
// 	try {
// 		const result = await sql`
//       SELECT id, name, code 
//       FROM states 
//       ORDER BY name
//     `
// 		// Ensure we're returning the rows array directly
// 		return result.rows || []
// 	} catch (error) {
// 		console.error('Error fetching states:', error)
// 		return [] // Return empty array on error to prevent map errors
// 	}
// }

// export async function getCitiesByState(stateId: number) {
// 	try {
// 		const result = await sql`
//       SELECT id, name, state_id 
//       FROM cities 
//       WHERE state_id = ${stateId}
//       ORDER BY name
//     `
// 		return result.rows
// 	} catch (error) {
// 		console.error('Error fetching cities:', error)
// 		throw error
// 	}
// }

// export async function getPropertyFeatures() {
// 	try {
// 		const result = await sql`
//       SELECT id, name, icon 
//       FROM property_features 
//       ORDER BY name
//     `
// 		return result.rows
// 	} catch (error) {
// 		console.error('Error fetching property features:', error)
// 		throw error
// 	}
// }

// export async function incrementPropertyViews(
// 	propertyId: number,
// 	userId?: number,
// 	ipAddress?: string
// ) {
// 	try {
// 		// Log the view
// 		await sql`
//       INSERT INTO property_views (property_id, user_id, ip_address)
//       VALUES (${propertyId}, ${userId || null}, ${ipAddress || null})
//     `

// 		// Increment the view counter
// 		await sql`
//       UPDATE properties 
//       SET views = views + 1 
//       WHERE id = ${propertyId}
//     `
// 	} catch (error) {
// 		console.error('Error incrementing property views:', error)
// 	}
// }

// export async function addPropertyToFavorites(
// 	userId: number,
// 	propertyId: number
// ) {
// 	try {
// 		await sql`
//       INSERT INTO favorites (user_id, property_id)
//       VALUES (${userId}, ${propertyId})
//       ON CONFLICT (user_id, property_id) DO NOTHING
//     `
// 		return true
// 	} catch (error) {
// 		console.error('Error adding to favorites:', error)
// 		throw error
// 	}
// }

// export async function removePropertyFromFavorites(
// 	userId: number,
// 	propertyId: number
// ) {
// 	try {
// 		await sql`
//       DELETE FROM favorites 
//       WHERE user_id = ${userId} AND property_id = ${propertyId}
//     `
// 		return true
// 	} catch (error) {
// 		console.error('Error removing from favorites:', error)
// 		throw error
// 	}
// }

// export async function getUserFavorites(userId: number) {
// 	try {
// 		const result = await sql`
//       SELECT p.*, 
//              s.name as state_name,
//              c.name as city_name,
//              (
//                SELECT json_agg(json_build_object(
//                  'id', pm.id,
//                  'url', pm.url,
//                  'thumbnail_url', pm.thumbnail_url,
//                  'type', pm.type,
//                  'is_primary', pm.is_primary
//                ))
//                FROM property_media pm
//                WHERE pm.property_id = p.id
//                LIMIT 1
//              ) as images
//       FROM properties p
//       JOIN favorites f ON p.id = f.property_id
//       JOIN states s ON p.state_id = s.id
//       JOIN cities c ON p.city_id = c.id
//       WHERE f.user_id = ${userId}
//       ORDER BY f.created_at DESC
//     `
// 		return result.rows
// 	} catch (error) {
// 		console.error('Error fetching user favorites:', error)
// 		throw error
// 	}
// }

// src/services/propertyService.ts - Optimized version
import { sql } from '@vercel/postgres'
import {
  ListingType,
	Property,
	PropertyFilter,
  PropertyType,
} from '@/types/property'

export async function getProperties(filter: PropertyFilter) {
	try {
		// Limit the default page size to prevent memory issues
		const limit = Math.min(filter.limit || 20, 50) // Max 50 items per page
		const offset = ((filter.page || 1) - 1) * limit

		// Build the query with better memory management
		let query = `
      SELECT 
        p.id,
        p.custom_id,
        p.title,
        p.property_type,
        p.listing_type,
        p.price,
        p.currency,
        p.status,
        p.featured,
        p.views,
        p.created_at,
        s.name as state_name,
        s.code as state_code,
        c.name as city_name,
        u.email as user_email,
        -- Only get essential attributes to reduce memory
        CASE 
          WHEN p.property_type = 'house' THEN json_build_object(
            'bedrooms', ha.bedrooms,
            'bathrooms', ha.bathrooms,
            'area_sqft', ha.area_sqft
          )
          WHEN p.property_type = 'apartment' THEN json_build_object(
            'bedrooms', aa.bedrooms,
            'bathrooms', aa.bathrooms,
            'area_sqft', aa.area_sqft,
            'floor', aa.floor
          )
          WHEN p.property_type = 'commercial' THEN json_build_object(
            'area_sqft', ca.area_sqft,
            'business_type', ca.business_type
          )
          WHEN p.property_type = 'land' THEN json_build_object(
            'area_acres', la.area_acres
          )
        END as attributes,
        -- Only get primary image to reduce payload
        (
          SELECT json_build_object(
            'id', pm.id,
            'url', pm.url,
            'thumbnail_url', pm.thumbnail_url,
            'type', pm.type,
            'is_primary', pm.is_primary
          )
          FROM property_media pm
          WHERE pm.property_id = p.id AND pm.is_primary = true AND pm.type = 'image'
          LIMIT 1
        ) as primary_image
      FROM properties p
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
      LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
      LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
      LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
      WHERE p.status = 'available'
    `

		const params: (PropertyType | ListingType | number | string | string[])[] = []
		let paramIndex = 1

		// Apply filters (same as before but with parameter validation)
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

		if (filter.state_id && filter.state_id > 0) {
			query += ` AND p.state_id = $${paramIndex}`
			params.push(filter.state_id)
			paramIndex++
		}

		if (filter.city_id && filter.city_id > 0) {
			query += ` AND p.city_id = $${paramIndex}`
			params.push(filter.city_id)
			paramIndex++
		}

		if (filter.min_price && filter.min_price > 0) {
			query += ` AND p.price >= $${paramIndex}`
			params.push(filter.min_price)
			paramIndex++
		}

		if (filter.max_price && filter.max_price > 0) {
			query += ` AND p.price <= $${paramIndex}`
			params.push(filter.max_price)
			paramIndex++
		}

		// Apply property-specific filters with validation
		if (
			filter.bedrooms && 
			filter.bedrooms > 0 &&
			(filter.property_type === 'house' || filter.property_type === 'apartment' || !filter.property_type)
		) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bedrooms >= $${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bedrooms >= $${paramIndex})
      )`
			params.push(filter.bedrooms)
			paramIndex++
		}

		if (
			filter.bathrooms && 
			filter.bathrooms > 0 &&
			(filter.property_type === 'house' || filter.property_type === 'apartment' || !filter.property_type)
		) {
			query += ` AND (
        (p.property_type = 'house' AND ha.bathrooms >= $${paramIndex}) OR
        (p.property_type = 'apartment' AND aa.bathrooms >= $${paramIndex})
      )`
			params.push(filter.bathrooms)
			paramIndex++
		}

		// Feature filters with limit to prevent huge IN clauses
		if (filter.features && filter.features.length > 0 && filter.features.length <= 10) {
			query += ` AND p.id IN (
        SELECT property_id 
        FROM property_to_features 
        WHERE feature_id = ANY($${paramIndex})
        GROUP BY property_id 
        HAVING COUNT(DISTINCT feature_id) >= ${Math.min(filter.features.length, 5)}
      )`
			params.push(filter.features.slice(0, 10).map(String)) // Limit to 10 features
			paramIndex++
		}

		// Apply sorting with validation
		const allowedSortFields = ['price', 'created_at', 'views']
		const sortBy = allowedSortFields.includes(filter.sort_by || '') ? filter.sort_by : 'created_at'
		const sortOrder = filter.sort_order === 'asc' ? 'asc' : 'desc'
		query += ` ORDER BY p.${sortBy} ${sortOrder}`

		// Apply pagination with limits
		query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
		params.push(limit, offset)

		console.log('Executing property query with params:', params.length)
		const result = await sql.query(query, params)
		
		// Transform the result to match expected format
		return result.rows.map(row => ({
			...row,
			images: row.primary_image ? [row.primary_image] : []
		}))
	} catch (error) {
		console.error('Error fetching properties:', error)
		throw new Error('Failed to fetch properties')
	}
}

// Optimized function for getting single property by custom ID
export async function getPropertyByCustomId(customId: string): Promise<Property | null> {
	try {
		// Validate input
		if (!customId || customId.length > 50) {
			return null
		}

		const query = `
      SELECT 
        p.*,
        s.name as state_name,
        s.code as state_code,
        c.name as city_name,
        u.email as user_email,
        u.phone as user_phone,
        u.is_agent as user_is_agent,
        u.agency_name as user_agency_name,
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
            'floors', ca.floors
          )
          WHEN p.property_type = 'land' THEN json_build_object(
            'area_acres', la.area_acres
          )
        END as attributes
      FROM properties p
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
      LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
      LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
      LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
      WHERE p.custom_id = $1
      LIMIT 1
    `

		const result = await sql.query(query, [customId])
		
		if (result.rows.length === 0) {
			return null
		}

		const property = result.rows[0]

		// Get images separately to avoid large JSON aggregations
		const imagesResult = await sql.query(`
			SELECT id, url, thumbnail_url, type, is_primary, display_order
			FROM property_media
			WHERE property_id = $1
			ORDER BY is_primary DESC, display_order, created_at
			LIMIT 20
		`, [property.id])

		// Get features separately
		const featuresResult = await sql.query(`
			SELECT pf.id, pf.name, pf.icon
			FROM property_features pf
			JOIN property_to_features ptf ON pf.id = ptf.feature_id
			WHERE ptf.property_id = $1
			LIMIT 50
		`, [property.id])

		return {
			...property,
			images: imagesResult.rows || [],
			features: featuresResult.rows || []
		}
	} catch (error) {
		console.error('Error fetching property by custom id:', error)
		throw new Error('Failed to fetch property')
	}
}

// Other functions remain the same but with added error handling and limits
export async function getStates() {
	try {
		const result = await sql`
      SELECT id, name, code 
      FROM states 
      ORDER BY name
      LIMIT 100
    `
		return result.rows || []
	} catch (error) {
		console.error('Error fetching states:', error)
		return []
	}
}

export async function getCitiesByState(stateId: number) {
	try {
		if (!stateId || stateId <= 0) {
			return []
		}

		const result = await sql`
      SELECT id, name, state_id 
      FROM cities 
      WHERE state_id = ${stateId}
      ORDER BY name
      LIMIT 500
    `
		return result.rows || []
	} catch (error) {
		console.error('Error fetching cities:', error)
		return []
	}
}

export async function getPropertyFeatures() {
	try {
		const result = await sql`
      SELECT id, name, icon 
      FROM property_features 
      ORDER BY name
      LIMIT 100
    `
		return result.rows || []
	} catch (error) {
		console.error('Error fetching property features:', error)
		return []
	}
}

// Rest of the functions with optimizations...
export async function incrementPropertyViews(
	propertyId: number,
	userId?: number,
	ipAddress?: string
) {
	try {
		if (!propertyId || propertyId <= 0) {
			return
		}

		// Use a single query with upsert to reduce database calls
				await sql`
      INSERT INTO property_views (property_id, user_id, ip_address, created_at)
      VALUES (${propertyId}, ${userId || null}, ${ipAddress || null}, NOW())
      ON CONFLICT (property_id, user_id, ip_address, DATE(created_at)) 
      DO NOTHING
    `

		// Increment the view counter in a separate, non-blocking query
		sql`UPDATE properties SET views = views + 1 WHERE id = ${propertyId}`.catch(
			err => console.error('Error updating view count:', err)
		)
	} catch (error) {
		console.error('Error incrementing property views:', error)
	}
}

export async function addPropertyToFavorites(
	userId: number,
	propertyId: number
) {
	try {
		if (!userId || !propertyId || userId <= 0 || propertyId <= 0) {
			throw new Error('Invalid user or property ID')
		}

		await sql`
      INSERT INTO favorites (user_id, property_id)
      VALUES (${userId}, ${propertyId})
      ON CONFLICT (user_id, property_id) DO NOTHING
    `
		return true
	} catch (error) {
		console.error('Error adding to favorites:', error)
		throw new Error('Failed to add to favorites')
	}
}

export async function removePropertyFromFavorites(
	userId: number,
	propertyId: number
) {
	try {
		if (!userId || !propertyId || userId <= 0 || propertyId <= 0) {
			throw new Error('Invalid user or property ID')
		}

		await sql`
      DELETE FROM favorites 
      WHERE user_id = ${userId} AND property_id = ${propertyId}
    `
		return true
	} catch (error) {
		console.error('Error removing from favorites:', error)
		throw new Error('Failed to remove from favorites')
	}
}

export async function getUserFavorites(userId: number) {
	try {
		if (!userId || userId <= 0) {
			return []
		}

		const result = await sql`
      SELECT p.id, p.custom_id, p.title, p.price, p.currency, p.listing_type,
             s.name as state_name,
             c.name as city_name,
             (
               SELECT json_build_object(
                 'id', pm.id,
                 'url', pm.url,
                 'thumbnail_url', pm.thumbnail_url,
                 'type', pm.type,
                 'is_primary', pm.is_primary
               )
               FROM property_media pm
               WHERE pm.property_id = p.id AND pm.is_primary = true AND pm.type = 'image'
               LIMIT 1
             ) as primary_image,
             f.created_at as favorited_at
      FROM properties p
      JOIN favorites f ON p.id = f.property_id
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      WHERE f.user_id = ${userId} AND p.status = 'available'
      ORDER BY f.created_at DESC
      LIMIT 100
    `
		
		return result.rows.map(row => ({
			...row,
			images: row.primary_image ? [row.primary_image] : []
		}))
	} catch (error) {
		console.error('Error fetching user favorites:', error)
		return []
	}
}
