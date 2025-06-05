'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
	Home,
	Building2,
	Landmark,
	Trees,
	Star,
	Eye,
	Users,
	TrendingUp,
	ArrowRight,
	Shield,
	Zap,
	Globe,
	ChevronDown,
	Menu,
	X,
} from 'lucide-react'

export default function LandingPage() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [scrollY, setScrollY] = useState(0)

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY)
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const stats = [
		{ icon: Home, label: 'Properties Listed', value: '10,000+' },
		{ icon: Users, label: 'Happy Clients', value: '5,000+' },
		{ icon: Building2, label: 'Cities Covered', value: '50+' },
		{ icon: Star, label: 'Customer Rating', value: '4.9/5' },
	]

	const propertyTypes = [
		{
			icon: Home,
			title: 'Residential Homes',
			description:
				'Find your perfect home from our extensive collection of houses',
			color: 'from-blue-500 to-blue-600',
		},
		{
			icon: Building2,
			title: 'Apartments',
			description: 'Modern apartments in prime locations across the city',
			color: 'from-green-500 to-green-600',
		},
		{
			icon: Landmark,
			title: 'Commercial Properties',
			description: 'Invest in commercial real estate for your business needs',
			color: 'from-purple-500 to-purple-600',
		},
		{
			icon: Trees,
			title: 'Land & Plots',
			description: 'Prime land parcels for development and investment',
			color: 'from-orange-500 to-orange-600',
		},
	]

	const features = [
		{
			icon: Shield,
			title: 'Secure Transactions',
			description:
				'All transactions are secure and verified for your peace of mind',
		},
		{
			icon: Zap,
			title: 'Fast Listings',
			description:
				'Quick and easy property listing process with instant publishing',
		},
		{
			icon: Globe,
			title: 'Wide Coverage',
			description: 'Properties across multiple cities and regions',
		},
	]

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
			{/* Navigation */}
			<nav
				className={`fixed top-0 w-full z-50 transition-all duration-300 ${
					scrollY > 50
						? 'bg-white/95 backdrop-blur-md shadow-lg'
						: 'bg-transparent'
				}`}
			>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center h-16'>
						<div className='flex items-center space-x-2'>
							<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
								<Home className='w-6 h-6 text-white' />
							</div>
							<span className='text-xl font-bold text-gray-900'>RealtyPro</span>
						</div>

						{/* Desktop Menu */}
						<div className='hidden md:flex items-center space-x-8'>
							<a
								href='#features'
								className='text-gray-700 hover:text-blue-600 transition-colors'
							>
								Features
							</a>
							<a
								href='#properties'
								className='text-gray-700 hover:text-blue-600 transition-colors'
							>
								Properties
							</a>
							<a
								href='#stats'
								className='text-gray-700 hover:text-blue-600 transition-colors'
							>
								About
							</a>
							<Link
								href='/login'
								className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105'
							>
								Admin Login
							</Link>
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='md:hidden p-2 rounded-lg hover:bg-gray-100'
						>
							{isMenuOpen ? (
								<X className='w-6 h-6' />
							) : (
								<Menu className='w-6 h-6' />
							)}
						</button>
					</div>

					{/* Mobile Menu */}
					{isMenuOpen && (
						<div className='md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t'>
							<div className='px-4 py-6 space-y-4'>
								<a
									href='#features'
									className='block text-gray-700 hover:text-blue-600'
								>
									Features
								</a>
								<a
									href='#properties'
									className='block text-gray-700 hover:text-blue-600'
								>
									Properties
								</a>
								<a
									href='#stats'
									className='block text-gray-700 hover:text-blue-600'
								>
									About
								</a>
								<Link
									href='/login'
									className='block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg'
								>
									Admin Login
								</Link>
							</div>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h1 className='text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6'>
							Premium Real Estate
							<span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
								Management System
							</span>
						</h1>
						<p className='text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto'>
							Streamline your property management with our comprehensive admin
							panel. Manage listings, track performance, and grow your real
							estate business.
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Link
								href='/login'
								className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
							>
								Access Admin Panel
								<ArrowRight className='ml-2 w-5 h-5' />
							</Link>
							<a
								href='#features'
								className='inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300'
							>
								Learn More
								<ChevronDown className='ml-2 w-5 h-5' />
							</a>
						</div>
					</div>

					{/* Hero Animation/Visual */}
					<div className='relative'>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-80'>
							{propertyTypes.map((type, index) => (
								<div
									key={index}
									className={`p-6 rounded-xl bg-gradient-to-br ${type.color} text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}
									style={{
										animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
									}}
								>
									<type.icon className='w-8 h-8 mb-4' />
									<h3 className='text-lg font-semibold mb-2'>{type.title}</h3>
									<p className='text-sm opacity-90'>{type.description}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section
				id='stats'
				className='py-20 bg-gradient-to-r from-blue-600 to-purple-600'
			>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
						{stats.map((stat, index) => (
							<div
								key={index}
								className='text-center text-white'
								style={{
									animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
								}}
							>
								<div className='flex justify-center mb-4'>
									<div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
										<stat.icon className='w-8 h-8' />
									</div>
								</div>
								<div className='text-3xl md:text-4xl font-bold mb-2'>
									{stat.value}
								</div>
								<div className='text-blue-100'>{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
							Powerful Admin Features
						</h2>
						<p className='text-xl text-gray-600 max-w-2xl mx-auto'>
							Everything you need to manage your real estate business
							efficiently
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{features.map((feature, index) => (
							<div
								key={index}
								className='p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2'
							>
								<div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6'>
									<feature.icon className='w-6 h-6 text-white' />
								</div>
								<h3 className='text-xl font-semibold text-gray-900 mb-4'>
									{feature.title}
								</h3>
								<p className='text-gray-600'>{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Property Types Section */}
			<section id='properties' className='py-20 bg-gray-50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
							Manage All Property Types
						</h2>
						<p className='text-xl text-gray-600 max-w-2xl mx-auto'>
							From residential homes to commercial properties, handle everything
							in one place
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
						{propertyTypes.map((type, index) => (
							<div
								key={index}
								className='group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300'
							>
								<div
									className={`w-16 h-16 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
								>
									<type.icon className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-2xl font-semibold text-gray-900 mb-4'>
									{type.title}
								</h3>
								<p className='text-gray-600 mb-6'>{type.description}</p>
								<div className='flex items-center text-blue-600 font-semibold'>
									Learn More
									<ArrowRight className='ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform duration-300' />
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 bg-gradient-to-r from-blue-600 to-purple-600'>
				<div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
					<h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
						Ready to Transform Your Real Estate Business?
					</h2>
					<p className='text-xl text-blue-100 mb-8'>
						Join thousands of real estate professionals who trust our platform
					</p>
					<Link
						href='/login'
						className='inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
					>
						Get Started Now
						<ArrowRight className='ml-2 w-5 h-5' />
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className='py-12 bg-gray-900'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col md:flex-row justify-between items-center'>
						<div className='flex items-center space-x-2 mb-4 md:mb-0'>
							<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
								<Home className='w-6 h-6 text-white' />
							</div>
							<span className='text-xl font-bold text-white'>RealtyPro</span>
						</div>
						<div className='text-gray-400 text-center md:text-right'>
							<p>&copy; 2024 RealtyPro. All rights reserved.</p>
							<p className='text-sm mt-1'>
								Professional Real Estate Management System
							</p>
						</div>
					</div>
				</div>
			</footer>

			<style jsx>{`
				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</div>
	)
}
