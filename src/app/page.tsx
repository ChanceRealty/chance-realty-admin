'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4'>
			<div className='flex items-center space-x-3 mb-6'>
				<div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
					<Home className='w-6 h-6 text-white' />
				</div>
				<h1 className='text-2xl font-bold text-gray-800'>Chance Realty Admin</h1>
			</div>

			<p className='text-gray-600 text-lg mb-8'>
				Բարի գալուստ անշարժ գույքի կառավարման վահանակ
			</p>

			<Link
				href='/login'
				className='px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition'
			>
				Մուտք գործել
			</Link>
		</div>
	)
}
