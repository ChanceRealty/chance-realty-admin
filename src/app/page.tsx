'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4'>
			<div className='flex items-center space-x-3 mb-6'>
					<Image
						src='/cclogo2.png'
						alt='Logo'
						width={48}
						height={48}
						className=' w-60 h-60'
					/>
			</div>
			<Link
				href='/login'
				className='px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition'
			>
				Մուտք գործել
			</Link>
		</div>
	)
}
