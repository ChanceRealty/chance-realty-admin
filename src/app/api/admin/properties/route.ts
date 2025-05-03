// src/app/api/admin/properties/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { PropertyType } from '@/types/property'

export async function POST(request: Request) {
	try {
		// Verify admin authentication
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		const formData = await request.formData()
		const propertyData = JSON.parse(formData.get('property') as string)
		const attributesData = JSON.parse(formData.get('attributes') as string)
		const primaryImageIndex = parseInt(
			(formData.get('primaryImageIndex') as string) || '0'
		)

		// Start a transaction
		await sql.query('BEGIN')

		try {
			// Check if custom_id already exists
			const existingProperty = await sql.query(
				'SELECT id FROM properties WHERE custom_id = $1',
				[propertyData.custom_id]
			)

			if (existingProperty.rows.length > 0) {
				throw new Error(
					'Property ID already exists. Please use a different ID.'
				)
			}

			// Insert the main property
			const propertyResult = await sql.query(
				`INSERT INTO properties (
          user_id, custom_id, title, description, property_type, listing_type,
          price, currency, state_id, city_id, address, postal_code,
          latitude, longitude, featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, custom_id`,
				[
					user.id,
					propertyData.custom_id,
					propertyData.title,
					propertyData.description,
					propertyData.property_type,
					propertyData.listing_type,
					propertyData.price,
					propertyData.currency,
					propertyData.state_id,
					propertyData.city_id,
					propertyData.address,
					propertyData.postal_code,
					propertyData.latitude,
					propertyData.longitude,
					propertyData.featured,
				]
			)

			const propertyId = propertyResult.rows[0].id

			// Insert property type specific attributes
			switch (propertyData.property_type as PropertyType) {
				case 'house':
					await sql.query(
						`INSERT INTO house_attributes (
              property_id, bedrooms, bathrooms, area_sqft, lot_size_sqft,
              floors, year_built, garage_spaces, basement, heating_type,
              cooling_type, roof_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.lot_size_sqft,
							attributesData.floors,
							attributesData.year_built,
							attributesData.garage_spaces,
							attributesData.basement,
							attributesData.heating_type,
							attributesData.cooling_type,
							attributesData.roof_type,
						]
					)
					break

				case 'apartment':
					await sql.query(
						`INSERT INTO apartment_attributes (
              property_id, bedrooms, bathrooms, area_sqft, floor,
              total_floors, unit_number, building_name, year_built,
              parking_spaces, balcony, elevator, security_system, pet_friendly
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.floor,
							attributesData.total_floors,
							attributesData.unit_number,
							attributesData.building_name,
							attributesData.year_built,
							attributesData.parking_spaces,
							attributesData.balcony,
							attributesData.elevator,
							attributesData.security_system,
							attributesData.pet_friendly,
						]
					)
					break

				case 'commercial':
					await sql.query(
						`INSERT INTO commercial_attributes (
              property_id, business_type, area_sqft, floors, year_built,
              parking_spaces, loading_dock, zoning_type, ceiling_height
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
						[
							propertyId,
							attributesData.business_type,
							attributesData.area_sqft,
							attributesData.floors,
							attributesData.year_built,
							attributesData.parking_spaces,
							attributesData.loading_dock,
							attributesData.zoning_type,
							attributesData.ceiling_height,
						]
					)
					break

				case 'land':
					await sql.query(
						`INSERT INTO land_attributes (
              property_id, area_acres, zoning_type, topography,
              road_access, utilities_available, is_fenced, soil_type,
              water_rights, mineral_rights
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
						[
							propertyId,
							attributesData.area_acres,
							attributesData.zoning_type,
							attributesData.topography,
							attributesData.road_access,
							attributesData.utilities_available,
							attributesData.is_fenced,
							attributesData.soil_type,
							attributesData.water_rights,
							attributesData.mineral_rights,
						]
					)
					break
			}

			// Insert property features
			if (
				propertyData.selectedFeatures &&
				propertyData.selectedFeatures.length > 0
			) {
				for (const featureId of propertyData.selectedFeatures) {
					await sql.query(
						`INSERT INTO property_to_features (property_id, feature_id)
             VALUES ($1, $2)`,
						[propertyId, featureId]
					)
				}
			}

			// Handle image uploads
			const images = formData.getAll('images') as File[]
			const uploadDir = join(process.cwd(), 'public', 'uploads', 'properties')

			// Create upload directory if it doesn't exist
			const fs = require('fs')
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true })
			}

			for (let i = 0; i < images.length; i++) {
				const file = images[i]
				const bytes = await file.arrayBuffer()
				const buffer = Buffer.from(bytes)

				// Generate unique filename
				const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
				const filename =
					file.name.replace(/\.[^/.]+$/, '') +
					'-' +
					uniqueSuffix +
					'.' +
					file.name.split('.').pop()
				const filepath = join(uploadDir, filename)

				// Write file
				await writeFile(filepath, buffer)

				// Save image record to database
				await sql.query(
					`INSERT INTO property_images (
            property_id, url, caption, image_type, display_order, is_primary
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
					[
						propertyId,
						`/uploads/properties/${filename}`,
						file.name,
						'general',
						i,
						i === primaryImageIndex,
					]
				)
			}

			// Commit transaction
			await sql.query('COMMIT')

			return NextResponse.json({
				success: true,
				propertyId,
				message: 'Property created successfully',
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Error creating property:', error)
		return NextResponse.json(
			{ error: 'Failed to create property' },
			{ status: 500 }
		)
	}
}

// Get all properties for admin
export async function GET(request: Request) {
	try {
		// Verify admin authentication
		const cookieStore = cookies()
		const token = (await cookieStore).get('token')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const user = verifyToken(token)
		if (!user || user.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		const result = await sql`
      SELECT 
        p.id,
        p.title,
        p.property_type,
        p.listing_type,
        p.price,
        p.status,
        p.featured,
        p.views,
        p.created_at,
        u.email as user_email,
        s.name as state_name,
        c.name as city_name,
        (
          SELECT url 
          FROM property_images 
          WHERE property_id = p.id AND is_primary = true 
          LIMIT 1
        ) as primary_image
      FROM properties p
      JOIN users u ON p.user_id = u.id
      JOIN states s ON p.state_id = s.id
      JOIN cities c ON p.city_id = c.id
      ORDER BY p.created_at DESC
    `

		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching properties:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch properties' },
			{ status: 500 }
		)
	}
}
