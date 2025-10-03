// src/app/api/admin/properties/route.ts - Updated with translation support
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { PropertyType } from '@/types/property'
import { uploadToImageKit } from '@/lib/imagekit'
import { translatePropertyData } from '@/lib/translateService'

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

		console.log('Creating property with translations:', {
			title: propertyData.title,
			customId: propertyData.custom_id,
			ownerName: propertyData.owner_name,
			ownerPhone: propertyData.owner_phone,
			status: propertyData.status,
			isHidden: propertyData.is_hidden,
			isExclusive: propertyData.is_exclusive,
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

			// Convert status to integer ID
			let statusId = 1 // Default to "available" (ID 1)

			if (propertyData.status) {
				if (typeof propertyData.status === 'number') {
					statusId = propertyData.status
				} else if (typeof propertyData.status === 'string') {
					const statusResult = await sql.query(
						'SELECT id FROM property_statuses WHERE name = $1 AND is_active = true LIMIT 1',
						[propertyData.status.trim()]
					)

					if (statusResult.rows.length > 0) {
						statusId = statusResult.rows[0].id
					}
				}
			}

			console.log('Using status ID:', statusId)

			// 🌐 TRANSLATE PROPERTY DATA
			console.log('🌐 Starting property translation...')
			let translations: {
				title_ru?: string
				title_en?: string
				description_ru?: string
				description_en?: string
			} = {}

			try {
				translations = await translatePropertyData(
					propertyData.title,
					propertyData.description || ''
				)
				console.log('✅ Translation completed:', {
					hasRussian: !!translations.title_ru,
					hasEnglish: !!translations.title_en,
				})
			} catch (translationError) {
				console.warn(
					'⚠️ Translation failed, proceeding without translations:',
					translationError
				)
				// Continue without translations rather than failing the entire process
			}

			// Insert the main property with translations
			const propertyResult = await sql.query(
				`INSERT INTO properties (
				  user_id, custom_id, title, description, property_type, listing_type,
				  price, currency, state_id, city_id, district_id, address, latitude, longitude, status, owner_name, owner_phone,
				  has_viber, has_whatsapp, has_telegram,
				  is_hidden, is_exclusive, address_admin,
				  title_ru, title_en, description_ru, description_en, 
				  translation_status, last_translated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
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
					propertyData.district_id,
					propertyData.address,
					propertyData.latitude,
					propertyData.longitude,
					statusId,
					propertyData.owner_name.trim(),
					propertyData.owner_phone.trim(),
					propertyData.has_viber || false,
					propertyData.has_whatsapp || false,
					propertyData.has_telegram || false,
					propertyData.is_hidden || false, 
					propertyData.is_exclusive || false,
					propertyData.address_admin?.trim() || null,
					translations.title_ru || null,
					translations.title_en || null,
					translations.description_ru || null,
					translations.description_en || null,
					translations.title_ru ? 'completed' : 'failed',
					translations.title_ru ? new Date() : null,
				]
			)

			const propertyId = propertyResult.rows[0].id
			console.log(`✅ Created property with ID: ${propertyId}`)

			// Insert translation records for tracking (optional, for detailed logging)
			if (translations.title_ru) {
				await sql.query(
					`INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
					 VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)`,
					[
						propertyId,
						'ru',
						'title',
						translations.title_ru,
						'google',
						'ru',
						'description',
						translations.description_ru,
						'google',
					]
				)
			}

			if (translations.title_en) {
				await sql.query(
					`INSERT INTO property_translations (property_id, language_code, field_name, translated_text, translation_source)
					 VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $9)`,
					[
						propertyId,
						'en',
						'title',
						translations.title_en,
						'google',
						'en',
						'description',
						translations.description_en,
						'google',
					]
				)
			}

			// Insert property type specific attributes (same as before)
			switch (propertyData.property_type as PropertyType) {
				case 'house':
					await sql.query(
						`INSERT INTO house_attributes (
              property_id, bedrooms, bathrooms, area_sqft, lot_size_sqft,
              floors, ceiling_height
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.lot_size_sqft,
							attributesData.floors,
							attributesData.ceiling_height,
						]
					)
					break

				case 'apartment':
					await sql.query(
						`INSERT INTO apartment_attributes (
              property_id, bedrooms, bathrooms, area_sqft, floor,
              total_floors, ceiling_height
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[
							propertyId,
							attributesData.bedrooms,
							attributesData.bathrooms,
							attributesData.area_sqft,
							attributesData.floor,
							attributesData.total_floors,
							attributesData.ceiling_height,
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

						uploadResults.push({
							success: false,
							fileName: file.name,
							error:
								uploadError instanceof Error
									? uploadError.message
									: 'Unknown upload error',
						})

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
			console.log(
				'🎉 Property creation with translations completed successfully!'
			)

			return NextResponse.json({
				success: true,
				propertyId,
				customId: propertyResult.rows[0].custom_id,
				message: 'Property created successfully with translations',
				mediaUploaded: mediaFiles.length,
				translations: {
					russian: !!translations.title_ru,
					english: !!translations.title_en,
				},
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

// Updated GET function to include translations
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
    p.title_ru,
    p.title_en,
    p.description,
    p.description_ru,
    p.description_en,
    p.property_type,
    p.listing_type,
    p.price,
    p.currency,
    p.translation_status,
    p.last_translated_at,
    p.views,
    p.created_at,
    p.updated_at,
    p.owner_name,
    p.owner_phone,
    p.is_hidden,
    p.is_exclusive,
	p.address_admin,
    p.has_viber,
    p.has_whatsapp,
    p.has_telegram,
    p.state_id,
    p.city_id,
    p.district_id,
    p.address,
    p.latitude,
    p.longitude,
    -- Status and location info
    ps.name as status_name,
    ps.color as status_color,
    ps.id as status_id,
    u.email as user_email,
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
    CASE 
      WHEN d.name_hy IS NOT NULL THEN d.name_hy || ', Երևան, ' || s.name
      WHEN c.name IS NOT NULL THEN c.name || ', ' || s.name
      ELSE s.name
    END as location_display,
    (
      SELECT url 
      FROM property_media 
      WHERE property_id = p.id AND is_primary = true AND type = 'image'
      LIMIT 1
    ) as primary_image,
    -- ✅ GET ATTRIBUTES BASED ON PROPERTY TYPE
    CASE 
      WHEN p.property_type = 'house' THEN (
        SELECT json_build_object(
          'bedrooms', ha.bedrooms,
          'bathrooms', ha.bathrooms,
          'area_sqft', ha.area_sqft,
          'lot_size_sqft', ha.lot_size_sqft,
          'floors', ha.floors,
          'ceiling_height', ha.ceiling_height
        )
        FROM house_attributes ha
        WHERE ha.property_id = p.id
      )
      WHEN p.property_type = 'apartment' THEN (
        SELECT json_build_object(
          'bedrooms', aa.bedrooms,
          'bathrooms', aa.bathrooms,
          'area_sqft', aa.area_sqft,
          'floor', aa.floor,
          'total_floors', aa.total_floors,
          'ceiling_height', aa.ceiling_height
        )
        FROM apartment_attributes aa
        WHERE aa.property_id = p.id
      )
      WHEN p.property_type = 'commercial' THEN (
        SELECT json_build_object(
          'business_type', ca.business_type,
          'area_sqft', ca.area_sqft,
          'floors', ca.floors,
          'ceiling_height', ca.ceiling_height
        )
        FROM commercial_attributes ca
        WHERE ca.property_id = p.id
      )
      WHEN p.property_type = 'land' THEN (
        SELECT json_build_object(
          'area_acres', la.area_acres
        )
        FROM land_attributes la
        WHERE la.property_id = p.id
      )
    END as attributes,
    -- ✅ GET FEATURES
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
    -- ✅ GET ALL MEDIA
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
    ) as media
  FROM properties p
  JOIN users u ON p.user_id = u.id
  JOIN states s ON p.state_id = s.id
  LEFT JOIN cities c ON p.city_id = c.id
  LEFT JOIN districts d ON p.district_id = d.id
  LEFT JOIN property_statuses ps ON p.status = ps.id
  WHERE (ps.is_active = true OR ps.id IS NULL)
  ORDER BY p.created_at DESC
`

		console.log(`✅ Admin API: Found ${result.rows.length} properties`)

		// Log some examples for debugging
		result.rows.slice(0, 3).forEach((row, index) => {
			console.log(`📊 Property ${row.id}: 
				- Location: ${row.location_display}
				- City: ${row.city_name} 
				- District: ${row.district_name || 'none'}
				- Status: ${row.status_name}`)
		})


		return NextResponse.json(result.rows)
	} catch (error) {
		console.error('Error fetching properties:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch properties' },
			{ status: 500 }
		)
	}
}
