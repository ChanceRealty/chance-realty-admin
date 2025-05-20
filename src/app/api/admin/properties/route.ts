// src/app/api/admin/properties/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { PropertyType } from '@/types/property'
import * as fs from 'fs'

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

		// Get all media files from the form
		const mediaFiles = formData.getAll('media') as File[]
		const mediaTypes = JSON.parse(
			(formData.get('mediaTypes') as string) || '[]'
		)
		const primaryMediaIndex = parseInt(
			(formData.get('primaryMediaIndex') as string) || '0'
		)

		console.log(
			'Received property data:',
			JSON.stringify(propertyData, null, 2)
		)
		console.log(
			'Received attributes data:',
			JSON.stringify(attributesData, null, 2)
		)
		console.log('Media files count:', mediaFiles.length)
		console.log('Media types:', mediaTypes)
		console.log('Primary media index:', primaryMediaIndex)

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

			// Fix for numeric overflow issues - validate before database insertion
			// Check bathrooms value (must be less than 100)
			if (
				attributesData.bathrooms &&
				parseFloat(attributesData.bathrooms) >= 100
			) {
				throw new Error('Bathroom count must be less than 100')
			}

			// Insert the main property
			const propertyResult = await sql.query(
				`INSERT INTO properties (
					user_id, custom_id, title, description, property_type, listing_type,
					price, currency, state_id, city_id, address, postal_code,
					latitude, longitude, featured, status
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
					'available', // Default status for new properties
				]
			)

			const propertyId = propertyResult.rows[0].id

			// Insert property type specific attributes
			switch (propertyData.property_type as PropertyType) {
				case 'house':
					await sql.query(
						`INSERT INTO house_attributes (
              property_id, bedrooms, bathrooms, area_sqft, lot_size_sqft,
              floors
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.lot_size_sqft,
							attributesData.floors,
						]
					)
					break

				case 'apartment':
					await sql.query(
						`INSERT INTO apartment_attributes (
              property_id, bedrooms, bathrooms, area_sqft, floor,
              total_floors
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.floor,
							attributesData.total_floors,
						]
					)
					break

				case 'commercial':
					await sql.query(
						`INSERT INTO commercial_attributes (
              property_id, business_type, area_sqft, floors, ceiling_height
            ) VALUES ($1, $2, $3, $4, $5)`,
						[
							propertyId,
							attributesData.business_type,
							attributesData.area_sqft,
							attributesData.floors,
							attributesData.ceiling_height,
						]
					)
					break

				case 'land':
					await sql.query(
						`INSERT INTO land_attributes (
              property_id, area_acres
            ) VALUES ($1, $2)`,
						[propertyId, attributesData.area_acres]
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

			// Handle media files upload using the local file system approach for now (temporary)
			if (mediaFiles && mediaFiles.length > 0) {
				const uploadDir = join(process.cwd(), 'public', 'uploads', 'properties')

				// Create upload directory if it doesn't exist
				if (!fs.existsSync(uploadDir)) {
					fs.mkdirSync(uploadDir, { recursive: true })
				}

				for (let i = 0; i < mediaFiles.length; i++) {
					const file = mediaFiles[i]
					const mediaType = mediaTypes[i] || 'image' // Default to image
					const isPrimary = i === primaryMediaIndex && mediaType === 'image'

					// Convert file to buffer
					const bytes = await file.arrayBuffer()
					const buffer = Buffer.from(bytes)

					// Generate unique filename
					const uniqueSuffix =
						Date.now() + '-' + Math.round(Math.random() * 1e9)
					const filename =
						file.name.replace(/\.[^/.]+$/, '') +
						'-' +
						uniqueSuffix +
						'.' +
						file.name.split('.').pop()
					const filepath = join(uploadDir, filename)
					const filePath = `/uploads/properties/${filename}`

					// Write file to disk
					await writeFile(filepath, buffer)

					// Save media info to database
					await sql.query(
						`INSERT INTO property_media (
							property_id, file_id, url, thumbnail_url, type, is_primary, display_order
						) VALUES (
							$1, $2, $3, $4, $5, $6, $7
						)`,
						[
							propertyId,
							uniqueSuffix.toString(), // Use as file ID
							filePath, // URL path
							filePath, // Same for thumbnail for now
							mediaType,
							isPrimary,
							i, // Use the index as display order
						]
					)
				}
			}

			// Commit transaction
			await sql.query('COMMIT')

			return NextResponse.json({
				success: true,
				propertyId,
				customId: propertyResult.rows[0].custom_id,
				message: 'Property created successfully',
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			console.error('Database error details:', error)
			throw error
		}
	} catch (error) {
		console.error('Error creating property:', error)
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to create property',
			},
			{ status: 500 }
		)
	}
}

// Get all properties for admin
export async function GET() {
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
        p.custom_id,
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
          FROM property_media 
          WHERE property_id = p.id AND is_primary = true AND type = 'image'
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
