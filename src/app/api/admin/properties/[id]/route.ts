// src/app/api/admin/properties/[id]/route.ts - Updated with owner fields
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { PropertyType } from '@/types/property'
import { uploadToImageKit } from '@/lib/imagekit'

// GET - Fetch single property for editing (updated to include owner details)
// src/app/api/admin/properties/[id]/route.ts - FIXED GET function
// Replace the existing GET function with this corrected version:

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

		// ✅ FIXED: Fetch property with proper status name join
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
				ps.name as status_name,
				ps.color as status_color,
				p.has_viber,
				p.has_whatsapp,
				p.has_telegram
			FROM properties p
			JOIN states s ON p.state_id = s.id
			JOIN cities c ON p.city_id = c.id
			LEFT JOIN districts d ON p.district_id = d.id
			JOIN users u ON p.user_id = u.id
			LEFT JOIN property_statuses ps ON p.status = ps.id
			WHERE p.id = ${id}
		`

		if (propertyResult.rows.length === 0) {
			return NextResponse.json({ error: 'Property not found' }, { status: 404 })
		}

		const property = propertyResult.rows[0]

		console.log('📊 Property status info:', {
			statusId: property.status,
			statusName: property.status_name,
			statusColor: property.status_color
		})

		// Fetch property-specific attributes
		let attributes = {}
		switch (property.property_type) {
			case 'house':
				const houseResult = await sql`
					SELECT * FROM house_attributes WHERE property_id = ${id}
				`
				attributes = houseResult.rows[0] || {}
				break

			case 'apartment':
				const apartmentResult = await sql`
					SELECT * FROM apartment_attributes WHERE property_id = ${id}
				`
				attributes = apartmentResult.rows[0] || {}
				break

			case 'commercial':
				const commercialResult = await sql`
					SELECT * FROM commercial_attributes WHERE property_id = ${id}
				`
				attributes = commercialResult.rows[0] || {}
				break

			case 'land':
				const landResult = await sql`
					SELECT * FROM land_attributes WHERE property_id = ${id}
				`
				attributes = landResult.rows[0] || {}
				break
		}

		// Fetch property features
		const featuresResult = await sql`
			SELECT pf.id, pf.name, pf.icon
			FROM property_features pf
			JOIN property_to_features ptf ON pf.id = ptf.feature_id
			WHERE ptf.property_id = ${id}
		`

		// ✅ FIXED: Return the property with status name instead of status ID
		const responseData = {
			...property,
			status: property.status_name || 'available', // ✅ Use status name for frontend
			status_id: property.status, // Keep the original ID for reference
			attributes,
			features: featuresResult.rows,
		}

		console.log('✅ Returning property data with status:', responseData.status)

		return NextResponse.json(responseData)
	} catch (error) {
		console.error('Error fetching property for edit:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch property' },
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

		console.log('Updating property:', {
			id,
			title: propertyData.title,
			ownerName: propertyData.owner_name,
			ownerPhone: propertyData.owner_phone,
			statusFromForm: propertyData.status,
			isHidden: propertyData.is_hidden,
			isExclusive: propertyData.is_exclusive,
			newMediaCount: mediaFiles.length,
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

		if (!propertyData.owner_name?.trim()) {
			return NextResponse.json(
				{ error: 'Owner name is required' },
				{ status: 400 }
			)
		}

		if (!propertyData.owner_phone?.trim()) {
			return NextResponse.json(
				{ error: 'Owner phone is required' },
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

			// ✅ FIX: Convert status name to status ID
			let statusId = 1 // Default to available
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
					updated_at = CURRENT_TIMESTAMP
				WHERE id = $22`,
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
					statusId, // ✅
					propertyData.owner_name.trim(),
					propertyData.owner_phone.trim(),
					propertyData.has_viber || false,
					propertyData.has_whatsapp || false,
					propertyData.has_telegram || false,
					propertyData.is_hidden || false, 
					propertyData.is_exclusive || false,
					id,
				]
			)

			console.log('✅ Property basic info updated successfully')

			// Update property-specific attributes (same as before)
			switch (propertyData.property_type as PropertyType) {
				case 'house':
					// Delete existing attributes
					await sql.query(
						'DELETE FROM house_attributes WHERE property_id = $1',
						[id]
					)
					// Insert new attributes
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

			// Update property features (same as before)
			// Delete existing features
			await sql.query(
				'DELETE FROM property_to_features WHERE property_id = $1',
				[id]
			)

			// Insert new features
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

			// Handle new media files if any (same as before)
			if (mediaFiles && mediaFiles.length > 0) {
				console.log(`Uploading ${mediaFiles.length} new media files...`)

				for (let i = 0; i < mediaFiles.length; i++) {
					const file = mediaFiles[i]
					const mediaType = mediaTypes[i] || 'image'
					const isPrimary = i === primaryMediaIndex && mediaType === 'image'

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

						// If this is going to be the new primary image, unset existing primary
						if (isPrimary) {
							await sql.query(
								'UPDATE property_media SET is_primary = false WHERE property_id = $1 AND type = $2',
								[id, 'image']
							)
						}

						// Save media info to database
						await sql.query(
							`INSERT INTO property_media (
								property_id, file_id, url, thumbnail_url, type, is_primary, display_order
							) VALUES (
								$1, $2, $3, $4, $5, $6, $7
							)`,
							[
								id,
								uploadResponse.fileId,
								uploadResponse.url,
								uploadResponse.thumbnailUrl || uploadResponse.url,
								mediaType,
								isPrimary,
								i,
							]
						)

						console.log(`✅ Successfully uploaded ${file.name}`)
					} catch (uploadError) {
						console.error(`❌ Failed to upload ${file.name}:`, uploadError)
						// Continue with other files rather than failing the entire update
					}
				}
			}

			// Commit transaction
			await sql.query('COMMIT')

			console.log('🎉 Property update completed successfully!')

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
