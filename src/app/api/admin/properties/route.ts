// src/app/api/admin/properties/route.ts - Updated with owner fields
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { PropertyType } from '@/types/property'
import { uploadToImageKit } from '@/lib/imagekit'

// src/app/api/admin/properties/route.ts - FIXED POST function
// Replace the existing POST function with this corrected version:

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

		console.log('Creating property with data:', {
			title: propertyData.title,
			customId: propertyData.custom_id,
			ownerName: propertyData.owner_name,
			ownerPhone: propertyData.owner_phone,
			statusFromForm: propertyData.status, // This is the status name like "available"
			mediaCount: mediaFiles.length,
		})

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

			// Validate required owner fields
			if (!propertyData.owner_name?.trim()) {
				throw new Error('Owner name is required')
			}

			if (!propertyData.owner_phone?.trim()) {
				throw new Error('Owner phone is required')
			}

			// Validate bathrooms value
			if (
				attributesData.bathrooms &&
				parseFloat(attributesData.bathrooms) >= 100
			) {
				throw new Error('Bathroom count must be less than 100')
			}

			// ✅ FIX: Convert status name to status ID
			let statusId = 1 // Default to available (assuming ID 1 is available)

			if (propertyData.status) {
				console.log('🔍 Looking up status ID for name:', propertyData.status)
				
				const statusResult = await sql.query(
					'SELECT id FROM property_statuses WHERE name = $1 AND is_active = true LIMIT 1',
					[propertyData.status.trim()]
				)

				if (statusResult.rows.length > 0) {
					statusId = statusResult.rows[0].id
					console.log('✅ Found status ID:', statusId, 'for name:', propertyData.status)
				} else {
					console.warn('⚠️ Status name not found, using default available (ID: 1)')
				}
			}

			console.log('💾 Creating property with status ID:', statusId)

			// Insert the main property with owner details
			const propertyResult = await sql.query(
				`INSERT INTO properties (
				  user_id, custom_id, title, description, property_type, listing_type,
				  price, currency, state_id, city_id, address, status, owner_name, owner_phone
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
					statusId, // ✅ Use integer status ID instead of string status name
					propertyData.owner_name.trim(),
					propertyData.owner_phone.trim(),
				]
			)

			const propertyId = propertyResult.rows[0].id
			console.log(`✅ Created property with ID: ${propertyId}`)

			// Insert property type specific attributes (same as before)
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

			// Insert property features (same as before)
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

			// Handle media files upload (same as before)
			if (mediaFiles && mediaFiles.length > 0) {
				console.log(
					`Starting upload of ${mediaFiles.length} media files to ImageKit...`
				)

				const uploadResults = []

				for (let i = 0; i < mediaFiles.length; i++) {
					const file = mediaFiles[i]
					const mediaType = mediaTypes[i] || 'image'
					const isPrimary = i === primaryMediaIndex && mediaType === 'image'

					console.log(
						`Processing file ${i + 1}/${mediaFiles.length}: ${
							file.name
						} (${mediaType})`
					)

					try {
						// Convert file to buffer
						const arrayBuffer = await file.arrayBuffer()
						const buffer = Buffer.from(arrayBuffer)

						// Upload to ImageKit using enhanced function
						const uploadResponse = await uploadToImageKit(
							buffer,
							file.name,
							`/properties/${propertyId}`
						)

						// Save media info to database
						const mediaResult = await sql.query(
							`INSERT INTO property_media (
								property_id, file_id, url, thumbnail_url, type, is_primary, display_order
							) VALUES (
								$1, $2, $3, $4, $5, $6, $7
							) RETURNING id`,
							[
								propertyId,
								uploadResponse.fileId,
								uploadResponse.url,
								uploadResponse.thumbnailUrl || uploadResponse.url,
								mediaType,
								isPrimary,
								i, // display_order
							]
						)

						uploadResults.push({
							success: true,
							fileName: file.name,
							mediaId: mediaResult.rows[0].id,
							imageKitId: uploadResponse.fileId,
							url: uploadResponse.url,
						})

						console.log(`✅ Successfully processed ${file.name}`)
					} catch (uploadError) {
						console.error(`❌ Failed to process ${file.name}:`, uploadError)

						// Add to results but don't fail the entire transaction
						uploadResults.push({
							success: false,
							fileName: file.name,
							error:
								uploadError instanceof Error
									? uploadError.message
									: 'Unknown upload error',
						})

						// If it's a critical error (like auth failure), throw to rollback
						if (
							uploadError instanceof Error &&
							(uploadError.message.includes('authenticate') ||
								uploadError.message.includes('configuration'))
						) {
							throw uploadError
						}
					}
				}

				console.log('Upload results:', uploadResults)

				// Check if any files failed to upload
				const failedUploads = uploadResults.filter(r => !r.success)
				if (failedUploads.length > 0) {
					console.warn(
						`${failedUploads.length} files failed to upload:`,
						failedUploads
					)
				}

				const successfulUploads = uploadResults.filter(r => r.success)
				console.log(
					`${successfulUploads.length}/${mediaFiles.length} files uploaded successfully`
				)
			}

			// Commit transaction
			await sql.query('COMMIT')
			console.log('🎉 Property creation transaction committed successfully')

			return NextResponse.json({
				success: true,
				propertyId,
				customId: propertyResult.rows[0].custom_id,
				message: 'Property created successfully',
				mediaUploaded: mediaFiles.length,
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			console.error(
				'❌ Property creation failed, transaction rolled back:',
				error
			)
			throw error
		}
	} catch (error) {
		console.error('❌ Error creating property:', error)
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to create property',
			},
			{ status: 500 }
		)
	}
}

// GET function updated to include owner details for admin
export async function GET() {
	try {
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
        p.views,
        p.created_at,
        p.owner_name,
        p.owner_phone,
        u.email as user_email,
        s.name as state_name,
        c.name as city_name,
		  ps.name as status_name,
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
	  LEFT JOIN property_statuses ps ON p.status = ps.id
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
