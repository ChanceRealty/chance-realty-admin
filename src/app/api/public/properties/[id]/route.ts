// src/app/api/public/properties/[id]/route.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import {
	getPropertyByCustomId,
	incrementPropertyViews,
} from '@/services/propertyService'
import { query } from '@/lib/db'

function corsResponse(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	return response
}

export async function OPTIONS() {
	return corsResponse(new NextResponse(null, { status: 204 }))
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: customId } = await params

		console.log(`🔍 Public API fetching property: ${customId}`)

		const property = await getPropertyByCustomId(customId)

		if (!property) {
			console.log(`❌ Property not found: ${customId}`)
			const response = NextResponse.json(
				{ error: 'Property not found' },
				{ status: 404 }
			)
			return corsResponse(response)
		}

		// Increment views (using the numeric ID for internal operations)
		const ip =
			request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
		await incrementPropertyViews(property.id, undefined, ip || undefined)

		// Remove owner details for public access
		const { owner_name, owner_phone, ...publicProperty } = property

		console.log(`✅ Returning public property: ${customId}`)

		const response = NextResponse.json(publicProperty)
		return corsResponse(response)
	} catch (error) {
		console.error('❌ Error fetching public property:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch property' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}

export async function GET_SINGLE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: customId } = await params

		// Get language from query parameter or Accept-Language header
		const { searchParams } = new URL(request.url)
		const langParam = searchParams.get('lang') || searchParams.get('language')
		const acceptLanguage = request.headers.get('accept-language')

		let language = 'hy' // Default to Armenian

		if (langParam) {
			language = langParam.toLowerCase()
		} else if (acceptLanguage) {
			const languages = acceptLanguage.split(',').map(lang => {
				const [code] = lang.trim().split(';')
				return code.split('-')[0].toLowerCase()
			})

			const supportedLangs = ['hy', 'ru', 'en']
			language = languages.find(lang => supportedLangs.includes(lang)) || 'hy'
		}

		console.log(
			`🔍 Public API fetching property: ${customId} in language: ${language}`
		)

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
				c.name as city_name,
				d.name as district_name,
				json_build_object('id', s.id, 'name', s.name) as state,
				json_build_object('id', c.id, 'name', c.name) as city,
				json_build_object('id', d.id, 'name', d.name) as district,
				-- Property attributes
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
			JOIN cities c ON p.city_id = c.id
			LEFT JOIN districts d ON p.district_id = d.id
			LEFT JOIN property_statuses ps ON p.status = ps.id
			LEFT JOIN house_attributes ha ON p.id = ha.property_id AND p.property_type = 'house'
			LEFT JOIN apartment_attributes aa ON p.id = aa.property_id AND p.property_type = 'apartment'
			LEFT JOIN commercial_attributes ca ON p.id = ca.property_id AND p.property_type = 'commercial'
			LEFT JOIN land_attributes la ON p.id = la.property_id AND p.property_type = 'land'
			WHERE p.custom_id = $1 AND ps.is_active = true
		`

		const result = await query(queryText, [customId, language])

		if (result.rows.length === 0) {
			console.log(`❌ Property not found: ${customId}`)
			const response = NextResponse.json(
				{ error: 'Property not found' },
				{ status: 404 }
			)
			return corsResponse(response)
		}

		const property = result.rows[0]

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

		// Increment views (using the numeric ID for internal operations)
		const ip =
			request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
		await query(
			`INSERT INTO property_views (property_id, ip_address, viewed_at) VALUES ($1, $2, NOW())`,
			[property.id, ip || 'unknown']
		)
		await query(`UPDATE properties SET views = views + 1 WHERE id = $1`, [
			property.id,
		])

		// Remove owner details for public access and use display fields
		const {
			owner_name,
			owner_phone,
			title,
			description,
			title_display,
			description_display,
			...publicProperty
		} = property

		const responseData = {
			...publicProperty,
			title: title_display, // Use the language-appropriate title
			description: description_display, // Use the language-appropriate description
			images: imagesResult.rows || [],
			features: featuresResult.rows || [],
			attributes: property.attributes || {},
		}

		console.log(`✅ Returning public property: ${customId} in ${language}`)

		const response = NextResponse.json(responseData)
		return corsResponse(response)
	} catch (error) {
		console.error('❌ Error fetching public property:', error)
		const response = NextResponse.json(
			{ error: 'Failed to fetch property' },
			{ status: 500 }
		)
		return corsResponse(response)
	}
}