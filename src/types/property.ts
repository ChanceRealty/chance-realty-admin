// src/types/property.ts

import { User } from "./auth"

export type ListingType = 'sale' | 'rent' | 'daily_rent'
export type PropertyType = 'house' | 'apartment' | 'commercial' | 'land'
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'pending'

export interface State {
	id: number
	name: string
	code: string
}

export interface City {
	id: number
	state_id: number
	name: string
	state?: State
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
	address: string
	postal_code?: string
	latitude?: number
	longitude?: number
	status: PropertyStatus
	featured: boolean
	views: number
	created_at: Date
	updated_at: Date

	// Relations
	state?: State
	city?: City
	features?: PropertyFeature[]
	images?: PropertyImage[]
	user?: User
}

export interface HouseAttributes {
	property_id: number
	bedrooms: number
	bathrooms: number
	area_sqft: number
	lot_size_sqft?: number
	floors?: number
	year_built?: number
	garage_spaces: number
	basement: boolean
	heating_type?: string
	cooling_type?: string
	roof_type?: string
}

export interface ApartmentAttributes {
	property_id: number
	bedrooms: number
	bathrooms: number
	area_sqft: number
	floor: number
	total_floors: number
	unit_number?: string
	building_name?: string
	year_built?: number
	parking_spaces: number
	balcony: boolean
	elevator: boolean
	security_system: boolean
	pet_friendly: boolean
}

export interface CommercialAttributes {
	property_id: number
	business_type?: string
	area_sqft: number
	floors?: number
	year_built?: number
	parking_spaces: number
	loading_dock: boolean
	zoning_type?: string
	ceiling_height?: number
}

export interface LandAttributes {
	property_id: number
	area_acres: number
	zoning_type?: string
	topography?: string
	road_access: boolean
	utilities_available: boolean
	is_fenced: boolean
	soil_type?: string
	water_rights: boolean
	mineral_rights: boolean
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

export interface PropertyDocument {
	id: number
	property_id: number
	name: string
	url: string
	document_type?: string
	uploaded_at: Date
}

export interface PropertyInquiry {
	id: number
	property_id: number
	user_id?: number
	name: string
	email: string
	phone?: string
	message: string
	status: string
	created_at: Date
}

export interface PropertyFilter {
	property_type?: PropertyType
	listing_type?: ListingType
	state_id?: number
	city_id?: number
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
}

// Extended property types with attributes
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

export type Property =
	| HouseProperty
	| ApartmentProperty
	| CommercialProperty
	| LandProperty
