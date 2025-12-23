// src/types/property.ts - Updated with dynamic status support

import { User } from './auth'

export type ListingType = 'sale' | 'rent' | 'daily_rent'
export type PropertyType = 'house' | 'apartment' | 'commercial' | 'land'

export interface ApartmentBuildingType {
	id: number
	name_hy: string 
	name_en: string 
	name_ru: string
	is_active: boolean
	sort_order: number
}

export interface CommercialBusinessType {
	id: number
	name_hy: string 
	name_en: string 
	name_ru: string 
	is_active: boolean
	sort_order: number
}

// Dynamic status interface from database
export interface PropertyStatus {
	id: number
	name: string
	color: string
	is_active: boolean
	sort_order: number
}

export interface District {
	id: number
	name: string
	name_hy: string
	name_en?: string
	name_ru?: string
	state_id: number
}

export interface State {
	id: number
	name: string
	uses_districts: boolean
	district_count?: number
	city_count?: number
}

export interface City {
	id: number
	state_id: number
	name: string
	district_id?: number // Optional reference to district
	state?: State
	district?: District
}

export interface PropertyFeature {
	id: number
	name: string
	icon?: string
}

export interface BaseProperty {
	id: number
	user_id: number
	custom_id: string
	title: string
	description?: string
	property_type: PropertyType
	listing_type: ListingType
	price: number
	currency: string
	state_id: number
	city_id: number
	district_id?: number // Add district support
	address: string
	status: string // Now references PropertyStatus.name
	views: number
	url_3d?: string
	created_at: Date
	updated_at: Date

	address_admin?: string

	is_hidden: boolean
	is_exclusive: boolean
	is_top: boolean 
	is_urgently: boolean
	// Owner details (admin only - not exposed to public)
	owner_name?: string
	owner_phone?: string

	has_viber?: boolean
	has_whatsapp?: boolean
	has_telegram?: boolean

	// Relations
	state?: State
	city?: City
	district?: District
	features?: PropertyFeature[]
	images?: PropertyImage[]
	user?: User
	status_info?: PropertyStatus // Populated with status details
}

// Admin-specific property interface that explicitly includes owner details
export interface AdminProperty extends BaseProperty {
	owner_name: string
	owner_phone: string
}

// Public property interface that explicitly excludes owner details
export interface PublicProperty
	extends Omit<BaseProperty, 'owner_name' | 'owner_phone'> {
	// Owner details are intentionally omitted for public access
}

export interface HouseAttributes {
	property_id: number
	bedrooms: number
	bathrooms: number
	area_sqft: number
	lot_size_sqft?: number
	floors?: number
	ceiling_height?: number
}

export interface ApartmentAttributes {
	property_id: number
	bedrooms: number
	bathrooms: number
	area_sqft: number
	floor: number
	total_floors: number
	ceiling_height?: number
	building_type_id?: number 
	building_type?: ApartmentBuildingType
}

export interface CommercialAttributes {
	property_id: number
	business_type?: string 
	business_type_id?: number 
	business_type_info?: CommercialBusinessType
	area_sqft: number
	floors?: number
	ceiling_height?: number
	rooms: number
}

export interface LandAttributes {
	property_id: number
	area_acres: number
}

export interface PropertyImage {
	id: number
	property_id: number
	url: string
	caption?: string
	image_type: string
	display_order: number
	is_primary: boolean
}

export interface PropertyFilter {
	property_type?: PropertyType
	listing_type?: ListingType
	state_id?: number | number[]
	city_id?: number | number[]
	district_id?: number | number[]
	min_price?: number
	max_price?: number
	bedrooms?: number
	bathrooms?: number
	min_area?: number
	max_area?: number
	features?: number[]
	sort_by?: 'price' | 'created_at' | 'views'
	sort_order?: 'asc' | 'desc'
	page?: number
	limit?: number
	is_hidden?: boolean
	is_exclusive?: boolean
	is_top?: boolean
	is_urgently?: boolean
	show_hidden?: boolean
	status?: string
	building_type_id?: number 
	business_type_id?: number 
}

// Extended property types with attributes (both admin and public versions)
export interface HouseProperty extends BaseProperty {
	property_type: 'house'
	attributes: HouseAttributes
}

export interface ApartmentProperty extends BaseProperty {
	property_type: 'apartment'
	attributes: ApartmentAttributes
}

export interface CommercialProperty extends BaseProperty {
	property_type: 'commercial'
	attributes: CommercialAttributes
}

export interface LandProperty extends BaseProperty {
	property_type: 'land'
	attributes: LandAttributes
}

// Union type for all property types
export type Property =
	| HouseProperty
	| ApartmentProperty
	| CommercialProperty
	| LandProperty

// Admin-specific property types that include owner details
export interface AdminHouseProperty extends AdminProperty {
	property_type: 'house'
	attributes: HouseAttributes
}

export interface AdminApartmentProperty extends AdminProperty {
	property_type: 'apartment'
	attributes: ApartmentAttributes
}

export interface AdminCommercialProperty extends AdminProperty {
	property_type: 'commercial'
	attributes: CommercialAttributes
}

export interface AdminLandProperty extends AdminProperty {
	property_type: 'land'
	attributes: LandAttributes
}

export type AdminPropertyType =
	| AdminHouseProperty
	| AdminApartmentProperty
	| AdminCommercialProperty
	| AdminLandProperty

// Public-specific property types that exclude owner details
export interface PublicHouseProperty extends PublicProperty {
	property_type: 'house'
	attributes: HouseAttributes
}

export interface PublicApartmentProperty extends PublicProperty {
	property_type: 'apartment'
	attributes: ApartmentAttributes
}

export interface PublicCommercialProperty extends PublicProperty {
	property_type: 'commercial'
	attributes: CommercialAttributes
}

export interface PublicLandProperty extends PublicProperty {
	property_type: 'land'
	attributes: LandAttributes
}

export type PublicPropertyType =
	| PublicHouseProperty
	| PublicApartmentProperty
	| PublicCommercialProperty
	| PublicLandProperty

// Helper type guards to distinguish between admin and public properties
export function isAdminProperty(
	property: BaseProperty
): property is AdminProperty {
	return 'owner_name' in property && 'owner_phone' in property
}

export function isPublicProperty(
	property: BaseProperty
): property is PublicProperty {
	return !('owner_name' in property) || !('owner_phone' in property)
}

// Utility function to convert admin property to public property (strip owner details)
export function toPublicProperty(adminProperty: AdminProperty): PublicProperty {
	const { owner_name, owner_phone, ...publicProperty } = adminProperty
	return publicProperty as PublicProperty
}

// Utility function to safely get owner info (returns empty if not admin property)
export function getOwnerInfo(property: BaseProperty): {
	name?: string
	phone?: string
} {
	if (isAdminProperty(property)) {
		return {
			name: property.owner_name,
			phone: property.owner_phone,
		}
	}
	return {}
}

// Helper function to get status color class
export function getStatusColorClass(status: PropertyStatus): string {
	const colorMap: Record<string, string> = {
		'#green': 'bg-green-100 text-green-800',
		'#blue': 'bg-blue-100 text-blue-800',
		'#red': 'bg-red-100 text-red-800',
		'#yellow': 'bg-yellow-100 text-yellow-800',
		'#purple': 'bg-purple-100 text-purple-800',
		'#indigo': 'bg-indigo-100 text-indigo-800',
		'#gray': 'bg-gray-100 text-gray-800',
	}

	return colorMap[status.color] || 'bg-gray-100 text-gray-800'
}


export function getLocationDisplayName(property: BaseProperty): string {
	const parts: string[] = []

	if (property.district?.name_hy) {
		parts.push(property.district.name_hy)
	}

	if (property.city?.name) {
		parts.push(property.city.name)
	}

	if (property.state?.name) {
		parts.push(property.state.name)
	}

	return parts.join(', ')
}

export function stateUsesDistricts(state: State | undefined): boolean {
	return state?.uses_districts === true
}

export function getBuildingTypeName(
	buildingType: ApartmentBuildingType | undefined,
	language: 'hy' | 'en' | 'ru' = 'hy'
): string {
	if (!buildingType) return ''

	switch (language) {
		case 'ru':
			return buildingType.name_ru
		case 'en':
			return buildingType.name_en
		default:
			return buildingType.name_hy
	}
}

export function getBusinessTypeName(
	businessType: CommercialBusinessType | undefined,
	language: 'hy' | 'en' | 'ru' = 'hy'
): string {
	if (!businessType) return ''

	switch (language) {
		case 'ru':
			return businessType.name_ru
		case 'en':
			return businessType.name_en
		default:
			return businessType.name_hy
	}
}