// src/app/admin/page.tsx - Simple dashboard page
'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import {
	Home,
	Building2,
	Landmark,
	Trees,
	Plus,
	TrendingUp,
	Eye,
	Users,
} from 'lucide-react'

interface DashboardStats {
	totalProperties: number
	availableProperties: number
	soldRentedProperties: number
	featuredProperties: number
	totalViews: number
	recentProperties: Array<{
		id: number
		title: string
		property_type: string
		created_at: string
		views: number
	}>
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		totalProperties: 0,
		availableProperties: 0,
		soldRentedProperties: 0,
		featuredProperties: 0,
		totalViews: 0,
		recentProperties: [],
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchDashboardStats()
	}, [])

	const fetchDashboardStats = async () => {
		try {
			const response = await fetch('/api/admin/properties')
			if (!response.ok) {
				throw new Error('Failed to fetch properties')
			}
			const properties = await response.json()

			// Calculate stats
			const totalProperties = properties.length
			const availableProperties = properties.filter(
				(p: any) => p.status === 'available'
			).length
			const soldRentedProperties = properties.filter(
				(p: any) => p.status === 'sold' || p.status === 'rented'
			).length
			const featuredProperties = properties.filter(
				(p: any) => p.featured
			).length
			const totalViews = properties.reduce(
				(sum: number, p: any) => sum + (p.views || 0),
				0
			)
			const recentProperties = properties
				.sort(
					(a: any, b: any) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				)
				.slice(0, 5)

			setStats({
				totalProperties,
				availableProperties,
				soldRentedProperties,
				featuredProperties,
				totalViews,
				recentProperties,
			})
		} catch (error) {
			console.error('Error fetching dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const propertyTypeIcons = {
		house: Home,
		apartment: Building2,
		commercial: Landmark,
		land: Trees,
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	if (loading) {
		return (
			<AdminLayout>
				<div className='flex items-center justify-center min-h-96'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
				</div>
			</AdminLayout>
		)
	}

	return (
		<AdminLayout>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
						<p className='text-gray-500'>
							Overview of your property management
						</p>
					</div>
					<Link
						href='/admin/properties/add'
						className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
					>
						<Plus className='w-5 h-5 mr-2' />
						Add Property
					</Link>
				</div>

				{/* Stats Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-blue-100'>
								<Home className='w-6 h-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>
									Total Properties
								</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.totalProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-green-100'>
								<TrendingUp className='w-6 h-6 text-green-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>Available</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.availableProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-red-100'>
								<Users className='w-6 h-6 text-red-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>Sold/Rented</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.soldRentedProperties}
								</p>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<div className='flex items-center'>
							<div className='p-3 rounded-full bg-yellow-100'>
								<Eye className='w-6 h-6 text-yellow-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-500'>Total Views</p>
								<p className='text-2xl font-bold text-gray-900'>
									{stats.totalViews}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					<Link
						href='/admin/properties'
						className='p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow'
					>
						<div className='flex items-center'>
							<Home className='w-8 h-8 text-blue-600' />
							<div className='ml-3'>
								<p className='font-medium text-gray-900'>View All Properties</p>
								<p className='text-sm text-gray-500'>Manage your listings</p>
							</div>
						</div>
					</Link>

					<Link
						href='/admin/properties/add'
						className='p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow'
					>
						<div className='flex items-center'>
							<Plus className='w-8 h-8 text-green-600' />
							<div className='ml-3'>
								<p className='font-medium text-gray-900'>Add New Property</p>
								<p className='text-sm text-gray-500'>Create a listing</p>
							</div>
						</div>
					</Link>

					<Link
						href='/admin/users'
						className='p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow'
					>
						<div className='flex items-center'>
							<Users className='w-8 h-8 text-purple-600' />
							<div className='ml-3'>
								<p className='font-medium text-gray-900'>Manage Users</p>
								<p className='text-sm text-gray-500'>User administration</p>
							</div>
						</div>
					</Link>

					<Link
						href='/admin/analytics'
						className='p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow'
					>
						<div className='flex items-center'>
							<TrendingUp className='w-8 h-8 text-orange-600' />
							<div className='ml-3'>
								<p className='font-medium text-gray-900'>View Analytics</p>
								<p className='text-sm text-gray-500'>Performance metrics</p>
							</div>
						</div>
					</Link>
				</div>

				{/* Recent Properties */}
				<div className='bg-white rounded-lg shadow'>
					<div className='p-6 border-b border-gray-200'>
						<div className='flex items-center justify-between'>
							<h2 className='text-lg font-semibold text-gray-900'>
								Recent Properties
							</h2>
							<Link
								href='/admin/properties'
								className='text-sm text-blue-600 hover:text-blue-800'
							>
								View all
							</Link>
						</div>
					</div>
					<div className='p-6'>
						{stats.recentProperties.length === 0 ? (
							<p className='text-gray-500 text-center py-4'>
								No properties yet
							</p>
						) : (
							<div className='space-y-4'>
								{stats.recentProperties.map(property => {
									const Icon =
										propertyTypeIcons[
											property.property_type as keyof typeof propertyTypeIcons
										] || Home
									return (
										<div
											key={property.id}
											className='flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg'
										>
											<div className='flex items-center'>
												<div className='p-2 bg-gray-100 rounded-lg'>
													<Icon className='w-5 h-5 text-gray-600' />
												</div>
												<div className='ml-3'>
													<p className='font-medium text-gray-900'>
														{property.title}
													</p>
													<p className='text-sm text-gray-500'>
														{property.property_type.charAt(0).toUpperCase() +
															property.property_type.slice(1)}{' '}
														• Added {formatDate(property.created_at)}
													</p>
												</div>
											</div>
											<div className='flex items-center space-x-4'>
												<div className='flex items-center text-sm text-gray-500'>
													<Eye className='w-4 h-4 mr-1' />
													{property.views}
												</div>
												<Link
													href={`/admin/properties/edit/${property.id}`}
													className='text-sm text-blue-600 hover:text-blue-800'
												>
													Edit
												</Link>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</div>

				{/* Featured Properties Summary */}
				{stats.featuredProperties > 0 && (
					<div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='text-lg font-semibold'>Featured Properties</h3>
								<p className='text-blue-100'>
									You have {stats.featuredProperties} featured{' '}
									{stats.featuredProperties === 1 ? 'property' : 'properties'}
								</p>
							</div>
							<div className='text-3xl font-bold'>
								{stats.featuredProperties}
							</div>
						</div>
					</div>
				)}
			</div>
		</AdminLayout>
	)
}
