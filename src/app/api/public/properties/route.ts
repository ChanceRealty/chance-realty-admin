// src/app/api/public/properties/route.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { PropertyFilter } from '@/types/property'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set(
		'Access-Control-Allow-Headers',
		'Content-Type, Accept-Language'
	)
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		// Get language from query parameter or Accept-Language header
		const langParam = searchParams.get('lang') || searchParams.get('language')
		const acceptLanguage = request.headers.get('accept-language')

		// Determine language priority: query param > accept-language header > default (hy)
		let language = 'hy' // Default to Armenian

		if (langParam) {
			language = langParam.toLowerCase()
		} else if (acceptLanguage) {
			// Parse Accept-Language header (e.g., "en-US,en;q=0.9,ru;q=0.8")
			const languages = acceptLanguage.split(',').map(lang => {
				const [code] = lang.trim().split(';')
				return code.split('-')[0].toLowerCase() // Get base language code
			})

			// Find first supported language
			const supportedLangs = ['hy', 'ru', 'en']
			language = languages.find(lang => supportedLangs.includes(lang)) || 'hy'
		}

		console.log(`🌐 Public API request in language: ${language}`)

		const filter: PropertyFilter = {
			property_type: searchParams.get('property_type') as any,
			listing_type: searchParams.get('listing_type') as any,
			state_id: searchParams.get('state_id')
				? parseInt(searchParams.get('state_id')!)
				: undefined,
			city_id: searchParams.get('city_id')
				? parseInt(searchParams.get('city_id')!)
				: undefined,
			district_id: searchParams.get('district_id')
				? parseInt(searchParams.get('district_id')!)
				: undefined,
			min_price: searchParams.get('min_price')
				? parseFloat(searchParams.get('min_price')!)
				: undefined,
			max_price: searchParams.get('max_price')
				? parseFloat(searchParams.get('max_price')!)
				: undefined,
			bedrooms: searchParams.get('bedrooms')
				? parseInt(searchParams.get('bedrooms')!)
				: undefined,
			bathrooms: searchParams.get('bathrooms')
				? parseInt(searchParams.get('bathrooms')!)
				: undefined,
			sort_by: searchParams.get('sort_by') as any,
			sort_order: searchParams.get('sort_order') as any,
			page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
			limit: searchParams.get('limit')
				? parseInt(searchParams.get('limit')!)
				: 20,
		}

		// ✅ FIXED: Proper query syntax with correct comma placement
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
				-- Original fields for reference
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
				p.district_id,
				p.address,
				p.latitude,
				p.longitude,
				s.name as state_name,
				CASE 
					WHEN c.id IS NOT NULL THEN c.name
					WHEN d.id IS NOT NULL THEN 'Երևան'
					ELSE 'Անհայտ քաղաք'
				END as city_name,
				d.name_hy as district_name,
				d.name_en as district_name_en,
				d.name_ru as district_name_ru,
				-- Location objects
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
				-- Property attributes based on type
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
						'ceiling_height', aa.ceiling_height
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
				-- Add language info
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
			LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
			LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
			LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
			LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
			WHERE (ps.is_active = true OR ps.id IS NULL)
		`

		const params = [language] // First parameter is always the language
		let paramIndex = 2 // Start from 2 since language is $1

		// Apply filters (same logic as before, but adjust parameter indices)
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

		if (filter.state_id) {
			query += ` AND p.state_id = $${paramIndex}`
			params.push(String(filter.state_id))
			paramIndex++
		}

		if (filter.city_id) {
			query += ` AND p.city_id = $${paramIndex}`
			params.push(String(filter.city_id))
			paramIndex++
		}

		if (filter.district_id) {
			query += ` AND p.district_id = $${paramIndex}`
			params.push(String(filter.district_id))
			paramIndex++
		}

		if (filter.min_price) {
			query += ` AND p.price >= $${paramIndex}`
			params.push(String(filter.min_price))
			paramIndex++
		}

		if (filter.max_price) {
			query += ` AND p.price <= $${paramIndex}`
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
			query += ` AND (
				(p.property_type = 'house' AND ha.bathrooms >= $${paramIndex}) OR
				(p.property_type = 'apartment' AND aa.bathrooms >= $${paramIndex})
			)`
			params.push(String(filter.bathrooms))
			paramIndex++
		}

		// Sorting
		const sortBy = filter.sort_by || 'created_at'
		const sortOrder = filter.sort_order || 'desc'

		const allowedSortFields = ['price', 'created_at', 'views', 'title']
		const safeSortBy = allowedSortFields.includes(sortBy)
			? sortBy
			: 'created_at'
		const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

		query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`

		// Pagination
		const limit = Math.min(filter.limit || 20, 100)
		const offset = ((filter.page || 1) - 1) * limit
		query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
		params.push(String(limit), String(offset))

		console.log(`✅ Executing public property query for language: ${language}`)
		console.log(`📊 Query params: ${JSON.stringify(params)}`)

		const result = await sql.query(query, params)

		console.log(`📊 Query returned ${result.rows.length} properties`)

		// Transform the result and remove owner details for public access
		const publicProperties = result.rows.map(row => {
			const { owner_name, owner_phone, ...publicProperty } = row
			return {
				...publicProperty,
				// Ensure arrays are properly formatted
				images: row.images || [],
				features: row.features || [],
				// Format attributes properly
				attributes: row.attributes || {},
			}
		})

		console.log(
			`✅ Returning ${publicProperties.length} public properties in ${language}`
		)

		// Return simple array format to match your frontend expectations
		const response = NextResponse.json(publicProperties)
		return corsResponse(response)
	} catch (error) {
		console.error('❌ Error fetching public properties:', error)
		console.error(
			'❌ Error stack:',
			error instanceof Error ? error.stack : 'No stack'
		)

		const response = NextResponse.json(
			{
				error: 'Failed to fetch properties',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
		return corsResponse(response)
	}
}
