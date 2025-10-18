// src/app/api/admin/properties/[id]/route.ts - Updated with owner fields
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { PropertyType } from '@/types/property'
import { uploadToImageKit } from '@/lib/imagekit'


export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: propertyId } = await params

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

		const id = parseInt(propertyId)
		if (isNaN(id)) {
			return NextResponse.json(
				{ error: 'Invalid property ID' },
				{ status: 400 }
			)
		}

		console.log('🏠 Fetching property for edit, ID:', id)

		// ✅ CRITICAL: Make sure to select ALL required fields including social media
		const propertyResult = await sql`
			SELECT 
				p.*,
				s.name as state_name,
				s.uses_districts,
				c.name as city_name,
				d.name_hy as district_name,
				d.name_en as district_name_en,
				d.name_ru as district_name_ru,
				u.email as user_email,
				COALESCE(ps.name, 'available') as status_name,
				COALESCE(ps.color, '#gray') as status_color
			FROM properties p
			JOIN users u ON p.user_id = u.id
			JOIN states s ON p.state_id = s.id
			LEFT JOIN cities c ON p.city_id = c.id
			LEFT JOIN districts d ON p.district_id = d.id
			LEFT JOIN property_statuses ps ON p.status = ps.id
			WHERE p.id = ${id}
		`

		if (propertyResult.rows.length === 0) {
			return NextResponse.json({ error: 'Property not found' }, { status: 404 })
		}

		const property = propertyResult.rows[0]

		console.log('🔍 Property social media fields from DB:', {
			has_viber: property.has_viber,
			has_whatsapp: property.has_whatsapp,
			has_telegram: property.has_telegram,
			owner_name: property.owner_name,
			owner_phone: property.owner_phone
		})

		// ✅ Fetch attributes with better error handling
		let attributes = {}
		console.log(`📊 Fetching ${property.property_type} attributes for property ${id}`)
		
		try {
			switch (property.property_type) {
				case 'house':
					const houseResult = await sql`
						SELECT bedrooms, bathrooms, area_sqft, lot_size_sqft, floors, ceiling_height
						FROM house_attributes WHERE property_id = ${id}
					`
					if (houseResult.rows.length > 0) {
						attributes = houseResult.rows[0]
						console.log('✅ House attributes found:', attributes)
					} else {
						console.log('❌ No house attributes found')
					}
					break

				case 'apartment':
					const apartmentResult = await sql`
						SELECT bedrooms, bathrooms, area_sqft, floor, total_floors, ceiling_height
						FROM apartment_attributes WHERE property_id = ${id}
					`
					if (apartmentResult.rows.length > 0) {
						attributes = apartmentResult.rows[0]
						console.log('✅ Apartment attributes found:', attributes)
					} else {
						console.log('❌ No apartment attributes found')
					}
					break

				case 'commercial':
					const commercialResult = await sql`
						SELECT business_type, area_sqft, floors, ceiling_height
						FROM commercial_attributes WHERE property_id = ${id}
					`
					if (commercialResult.rows.length > 0) {
						attributes = commercialResult.rows[0]
						console.log('✅ Commercial attributes found:', attributes)
					} else {
						console.log('❌ No commercial attributes found')
					}
					break

				case 'land':
					const landResult = await sql`
						SELECT area_acres
						FROM land_attributes WHERE property_id = ${id}
					`
					if (landResult.rows.length > 0) {
						attributes = landResult.rows[0]
						console.log('✅ Land attributes found:', attributes)
					} else {
						console.log('❌ No land attributes found')
						// Let's check if the record exists at all
						const checkLand = await sql`
							SELECT COUNT(*) as count FROM land_attributes WHERE property_id = ${id}
						`
						console.log('🔍 Land attributes count:', checkLand.rows[0]?.count || 0)
					}
					break

				default:
					console.log('❌ Unknown property type:', property.property_type)
			}
		} catch (attributeError) {
			console.error('❌ Error fetching attributes:', attributeError)
		}

		// ✅ Fetch features with better error handling
		let features: { id: number; name: string; icon: string }[] = []
		console.log(`🏷️ Fetching features for property ${id}`)
		
		try {
			const featuresResult = await sql`
				SELECT pf.id, pf.name, pf.icon
				FROM property_features pf
				JOIN property_to_features ptf ON pf.id = ptf.feature_id
				WHERE ptf.property_id = ${id}
				ORDER BY pf.name
			`
			features = featuresResult.rows.map(row => ({
				id: Number(row.id),
				name: String(row.name),
				icon: String(row.icon)
			}))
			console.log(`✅ Found ${features.length} features:`, features)
		} catch (featureError) {
			console.error('❌ Error fetching features:', featureError)
		}

		// ✅ Fetch media
		let media: {
			id: number;
			file_id: string;
			url: string;
			thumbnail_url: string;
			type: string;
			is_primary: boolean;
			display_order: number;
			created_at?: string;
		}[] = []
		try {
			const mediaResult = await sql`
				SELECT id, file_id, url, thumbnail_url, type, is_primary, display_order
				FROM property_media 
				WHERE property_id = ${id}
				ORDER BY is_primary DESC, display_order, created_at
			`
			media = mediaResult.rows.map(row => ({
				id: Number(row.id),
				file_id: String(row.file_id),
				url: String(row.url),
				thumbnail_url: String(row.thumbnail_url),
				type: String(row.type),
				is_primary: Boolean(row.is_primary),
				display_order: Number(row.display_order),
				created_at: row.created_at ? String(row.created_at) : undefined
			}))
			console.log(`✅ Found ${media.length} media items`)
		} catch (mediaError) {
			console.error('❌ Error fetching media:', mediaError)
		}

		// ✅ CRITICAL: Build response with explicit field mapping
		const responseData = {
			// Basic property info
			id: property.id,
			custom_id: property.custom_id,
			title: property.title,
			description: property.description,
			property_type: property.property_type,
			listing_type: property.listing_type,
			price: property.price,
			currency: property.currency,
			
			// Location info
			state_id: property.state_id,
			city_id: property.city_id,
			district_id: property.district_id,
			address: property.address,
			latitude: property.latitude,
			longitude: property.longitude,
			
			// Location display names
			state_name: property.state_name,
			city_name: property.city_name,
			district_name: property.district_name,
			
			// Status info
			status: property.status_name || 'available',
			status_name: property.status_name,
			status_color: property.status_color,
			status_id: property.status,
			
			// Visibility
			is_hidden: property.is_hidden || false,
			is_exclusive: property.is_exclusive || false,
			
			// Owner info (these are working)
			owner_name: property.owner_name,
			owner_phone: property.owner_phone,
			address_admin: property.address_admin || '',
			
			// ✅ CRITICAL: Explicitly set social media fields
			has_viber: Boolean(property.has_viber),
			has_whatsapp: Boolean(property.has_whatsapp),
			has_telegram: Boolean(property.has_telegram),
			
			// Meta info
			views: property.views || 0,
			created_at: property.created_at,
			updated_at: property.updated_at,
			user_email: property.user_email,
			
			// ✅ CRITICAL: Structured data
			attributes: attributes,
			features: features,
			images: media.filter(m => m.type === 'image'),
			videos: media.filter(m => m.type === 'video'),
			media: media,
		}

		// Final debug log
		console.log('📤 Final API Response Structure:', {
			id: responseData.id,
			custom_id: responseData.custom_id,
			property_type: responseData.property_type,
			
			// Data completeness check
			hasAttributes: Object.keys(responseData.attributes).length > 0,
			attributesKeys: Object.keys(responseData.attributes),
			
			hasFeatures: responseData.features.length > 0,
			featuresCount: responseData.features.length,
			
			hasSocialMedia: responseData.has_viber || responseData.has_whatsapp || responseData.has_telegram,
			socialMedia: {
				viber: responseData.has_viber,
				whatsapp: responseData.has_whatsapp,
				telegram: responseData.has_telegram
			},
			
			hasOwnerInfo: !!(responseData.owner_name && responseData.owner_phone),
			ownerInfo: {
				name: responseData.owner_name,
				phone: responseData.owner_phone,
				address: responseData.address_admin || ''
			},
			
			mediaCount: responseData.media.length,
			imagesCount: responseData.images.length
		})

		return NextResponse.json(responseData)

	} catch (error) {
		console.error('❌ Error fetching property for edit:', error)
		return NextResponse.json(
			{ 
				error: 'Failed to fetch property',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: propertyId } = await params

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

		const id = parseInt(propertyId)
		if (isNaN(id)) {
			return NextResponse.json(
				{ error: 'Invalid property ID' },
				{ status: 400 }
			)
		}

		const formData = await request.formData()
		const propertyData = JSON.parse(formData.get('property') as string)
		const attributesData = JSON.parse(formData.get('attributes') as string)

		// Get new media files if any
		const mediaFiles = formData.getAll('media') as File[]
		const mediaTypes = JSON.parse(
			(formData.get('mediaTypes') as string) || '[]'
		)
		const primaryMediaIndex = parseInt(
			(formData.get('primaryMediaIndex') as string) || '0'
		)

		// ✅ Get existing media order
		const existingMediaOrderStr = formData.get('existingMediaOrder') as string
		const existingMediaOrder = existingMediaOrderStr
			? JSON.parse(existingMediaOrderStr)
			: []

		console.log(
			'📊 Existing media order from client:',
			existingMediaOrder.map((m: any) => ({
				id: m.id,
				display_order: m.display_order,
				is_primary: m.is_primary,
			}))
		)

		console.log('Updating property:', {
			id,
			title: propertyData.title,
			ownerName: propertyData.owner_name,
			ownerPhone: propertyData.owner_phone,
			statusFromForm: propertyData.status,
			isHidden: propertyData.is_hidden,
			isExclusive: propertyData.is_exclusive,
			newMediaCount: mediaFiles.length,
			existingMediaCount: existingMediaOrder.length,
		})

		// Validate required fields
		if (!propertyData.title?.trim()) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 })
		}

		if (!propertyData.custom_id?.trim()) {
			return NextResponse.json(
				{ error: 'Property ID is required' },
				{ status: 400 }
			)
		}


		// Start transaction
		await sql.query('BEGIN')

		try {
			// Check if custom_id exists for other properties
			const existingProperty = await sql.query(
				'SELECT id FROM properties WHERE custom_id = $1 AND id != $2',
				[propertyData.custom_id, id]
			)

			if (existingProperty.rows.length > 0) {
				throw new Error('Property ID already exists for another property')
			}

			// ✅ Convert status name to status ID
			let statusId = 1 // Default to available
			if (propertyData.status) {
				console.log('🔍 Looking up status ID for name:', propertyData.status)

				const statusResult = await sql.query(
					'SELECT id FROM property_statuses WHERE name = $1 AND is_active = true LIMIT 1',
					[propertyData.status.trim()]
				)

				if (statusResult.rows.length > 0) {
					statusId = statusResult.rows[0].id
					console.log(
						'✅ Found status ID:',
						statusId,
						'for name:',
						propertyData.status
					)
				} else {
					console.warn(
						'⚠️ Status name not found, using default available (ID: 1)'
					)
				}
			}

			console.log('💾 Updating property with status ID:', statusId)

			// Update main property including owner details
			await sql.query(
				`UPDATE properties SET
					custom_id = $1,
					title = $2,
					description = $3,
					property_type = $4,
					listing_type = $5,
					price = $6,
					currency = $7,
					state_id = $8,
					city_id = $9,
					district_id = $10,
					address = $11,
					latitude = $12,
					longitude = $13,
					status = $14,
					owner_name = $15,
					owner_phone = $16,
					has_viber = $17,
					has_whatsapp = $18,
					has_telegram = $19,
					is_hidden = $20,
					is_exclusive = $21,
					address_admin = $22,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = $23`,
				[
					propertyData.custom_id.trim(),
					propertyData.title.trim(),
					propertyData.description?.trim() || null,
					propertyData.property_type,
					propertyData.listing_type,
					propertyData.price,
					propertyData.currency,
					propertyData.state_id,
					propertyData.city_id,
					propertyData.district_id,
					propertyData.address?.trim() || null,
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
					id,
				]
			)

			console.log('✅ Property basic info updated successfully')

			// Update property-specific attributes
			switch (propertyData.property_type as PropertyType) {
				case 'house':
					await sql.query(
						'DELETE FROM house_attributes WHERE property_id = $1',
						[id]
					)
					await sql.query(
						`INSERT INTO house_attributes (
							property_id, bedrooms, bathrooms, area_sqft, lot_size_sqft, floors, ceiling_height
						) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[
							id,
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
						'DELETE FROM apartment_attributes WHERE property_id = $1',
						[id]
					)
					await sql.query(
						`INSERT INTO apartment_attributes (
							property_id, bedrooms, bathrooms, area_sqft, floor, total_floors, ceiling_height
						) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[
							id,
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
						'DELETE FROM commercial_attributes WHERE property_id = $1',
						[id]
					)
					await sql.query(
						`INSERT INTO commercial_attributes (
							property_id, business_type, area_sqft, floors, ceiling_height
						) VALUES ($1, $2, $3, $4, $5)`,
						[
							id,
							attributesData.business_type,
							attributesData.area_sqft,
							attributesData.floors,
							attributesData.ceiling_height,
						]
					)
					break

				case 'land':
					await sql.query(
						'DELETE FROM land_attributes WHERE property_id = $1',
						[id]
					)
					await sql.query(
						`INSERT INTO land_attributes (
							property_id, area_acres
						) VALUES ($1, $2)`,
						[id, attributesData.area_acres]
					)
					break
			}

			// Update property features
			await sql.query(
				'DELETE FROM property_to_features WHERE property_id = $1',
				[id]
			)

			if (
				propertyData.selectedFeatures &&
				propertyData.selectedFeatures.length > 0
			) {
				for (const featureId of propertyData.selectedFeatures) {
					await sql.query(
						'INSERT INTO property_to_features (property_id, feature_id) VALUES ($1, $2)',
						[id, featureId]
					)
				}
			}

			// ✅ STEP 1: Calculate the starting display_order for new media
			const maxExistingOrder =
				existingMediaOrder.length > 0
					? Math.max(...existingMediaOrder.map((m: any) => m.display_order))
					: -1

			console.log(`📊 Max existing display_order: ${maxExistingOrder}`)

			// ✅ STEP 2: Upload new media files FIRST (if any)
			const newMediaIds: number[] = []

			if (mediaFiles && mediaFiles.length > 0) {
				console.log(`📤 Uploading ${mediaFiles.length} new media files...`)
				const startingDisplayOrder = maxExistingOrder + 1

				for (let i = 0; i < mediaFiles.length; i++) {
					const file = mediaFiles[i]
					const mediaType = mediaTypes[i] || 'image'

					// Calculate absolute display_order
					const absoluteDisplayOrder = startingDisplayOrder + i

					console.log(
						`📸 Uploading file ${i + 1}/${mediaFiles.length}: ${
							file.name
						}, display_order: ${absoluteDisplayOrder}`
					)

					try {
						// Convert file to buffer
						const arrayBuffer = await file.arrayBuffer()
						const buffer = Buffer.from(arrayBuffer)

						// Upload to ImageKit
						const uploadResponse = await uploadToImageKit(
							buffer,
							file.name,
							`/properties/${id}`
						)

						let thumbnailUrl = uploadResponse.thumbnailUrl || uploadResponse.url

						if (mediaType === 'video') {
							if (uploadResponse.url.includes('ik.imagekit.io')) {
								const baseVideoUrl = uploadResponse.url.split('?')[0]
								thumbnailUrl = `${baseVideoUrl}/ik-thumbnail.jpg?tr=so-1.0:w-400:h-300:q-80`
								console.log(`✅ Generated video thumbnail URL: ${thumbnailUrl}`)
							} else {
								thumbnailUrl = uploadResponse.url
							}
						}

						// Save media info to database with absolute display_order
						const mediaResult = await sql.query(
							`INSERT INTO property_media (
								property_id, file_id, url, thumbnail_url, type, is_primary, display_order
							) VALUES (
								$1, $2, $3, $4, $5, $6, $7
							) RETURNING id`,
							[
								id,
								uploadResponse.fileId,
								uploadResponse.url,
								thumbnailUrl,
								mediaType,
								false, // Set is_primary later
								absoluteDisplayOrder,
							]
						)

						newMediaIds.push(mediaResult.rows[0].id)
						console.log(
							`✅ Successfully uploaded ${file.name} with display_order ${absoluteDisplayOrder}, id: ${mediaResult.rows[0].id}`
						)
					} catch (uploadError) {
						console.error(`❌ Failed to upload ${file.name}:`, uploadError)
						// Continue with other files rather than failing the entire update
					}
				}
			}

			// ✅ STEP 3: Update existing media display_order and is_primary
			console.log('📝 Updating existing media display orders...')

			// First, unset all is_primary flags
			await sql.query(
				'UPDATE property_media SET is_primary = false WHERE property_id = $1 AND type = $2',
				[id, 'image']
			)

			// Then update each existing media item's display_order and is_primary
			for (const mediaItem of existingMediaOrder) {
				console.log(
					`📝 Updating existing media ${mediaItem.id}: order=${mediaItem.display_order}, primary=${mediaItem.is_primary}`
				)

				await sql.query(
					`UPDATE property_media 
					SET 
						display_order = $1,
						is_primary = $2
					WHERE id = $3 AND property_id = $4`,
					[
						mediaItem.display_order,
						mediaItem.is_primary && mediaItem.type !== 'video',
						mediaItem.id,
						id,
					]
				)
			}

			// ✅ STEP 4: Ensure the first item (display_order = 0) is set as primary if it's an image
			const firstMediaResult = await sql.query(
				`SELECT id, type FROM property_media 
				WHERE property_id = $1 AND display_order = 0
				LIMIT 1`,
				[id]
			)

			if (
				firstMediaResult.rows.length > 0 &&
				firstMediaResult.rows[0].type === 'image'
			) {
				await sql.query(
					'UPDATE property_media SET is_primary = true WHERE id = $1',
					[firstMediaResult.rows[0].id]
				)
				console.log(
					`✅ Set media ${firstMediaResult.rows[0].id} as primary (first in order)`
				)
			} else if (firstMediaResult.rows.length > 0) {
				console.log(
					`ℹ️ First media (order 0) is a video, not setting as primary`
				)
			}

			// Commit transaction
			await sql.query('COMMIT')

			console.log('🎉 Property update completed successfully!')
			console.log('📊 Final summary:')
			console.log(`  - Existing media updated: ${existingMediaOrder.length}`)
			console.log(`  - New media uploaded: ${newMediaIds.length}`)
			console.log(
				`  - Total media count: ${
					existingMediaOrder.length + newMediaIds.length
				}`
			)

			return NextResponse.json({
				success: true,
				message: 'Property updated successfully',
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			console.error('Property update failed:', error)
			throw error
		}
	} catch (error) {
		console.error('Error updating property:', error)
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to update property',
			},
			{ status: 500 }
		)
	}
}

// DELETE function remains the same as it doesn't need changes for owner fields
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: propertyId } = await params

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

		const id = parseInt(propertyId)
		if (isNaN(id)) {
			return NextResponse.json(
				{ error: 'Invalid property ID' },
				{ status: 400 }
			)
		}

		// Start transaction
		await sql.query('BEGIN')

		try {
			// Get all media files to delete from ImageKit
			const mediaResult = await sql`
				SELECT file_id FROM property_media WHERE property_id = ${id}
			`

			// Delete related records (cascading delete)
			await sql.query('DELETE FROM property_media WHERE property_id = $1', [id])
			await sql.query(
				'DELETE FROM property_to_features WHERE property_id = $1',
				[id]
			)
			await sql.query('DELETE FROM property_views WHERE property_id = $1', [id])
			await sql.query('DELETE FROM favorites WHERE property_id = $1', [id])

			// Delete property-specific attributes
			await sql.query('DELETE FROM house_attributes WHERE property_id = $1', [
				id,
			])
			await sql.query(
				'DELETE FROM apartment_attributes WHERE property_id = $1',
				[id]
			)
			await sql.query(
				'DELETE FROM commercial_attributes WHERE property_id = $1',
				[id]
			)
			await sql.query('DELETE FROM land_attributes WHERE property_id = $1', [
				id,
			])

			// Finally delete the property itself
			const deleteResult = await sql.query(
				'DELETE FROM properties WHERE id = $1',
				[id]
			)

			if (deleteResult.rowCount === 0) {
				throw new Error('Property not found')
			}

			// Commit transaction
			await sql.query('COMMIT')

			return NextResponse.json({
				success: true,
				message: 'Property deleted successfully',
			})
		} catch (error) {
			// Rollback transaction on error
			await sql.query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('Error deleting property:', error)
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to delete property',
			},
			{ status: 500 }
		)
	}
}
