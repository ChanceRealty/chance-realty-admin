// src/components/AdminLayout.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, ChevronDown, LogOut } from 'lucide-react'

interface AdminLayoutProps {
	children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
	const router = useRouter()

	const handleLogout = async () => {
		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include',
			})

			if (response.ok) {
				router.push('/login')
			} else {
				console.error('Logout failed')
			}
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	return (
		<div className='min-h-screen bg-gray-100'>
			{/* Top Navigation */}
			<header className='bg-white shadow-sm'>
				<div className='flex items-center justify-between px-4 py-3'>
					{/* Removed sidebar toggle button */}

					<div className='flex items-center space-x-4 ml-auto'>
					

						{/* Notifications
						<button className='p-2 rounded-lg hover:bg-gray-100 relative'>
							<Bell className='w-6 h-6' />
							<span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
						</button> */}

						{/* Profile Menu */}
						<div className='relative'>
							<button
								onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
								className='flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100'
							>
								<div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
									<span className='text-gray-600 font-medium'>A</span>
								</div>
								<span className='hidden md:inline text-gray-700'>Ադմինիստրատոր</span>
								<ChevronDown className='w-4 h-4' />
							</button>

							{isProfileMenuOpen && (
								<div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50'>
									<Link
										href='/admin/profile'
										className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
									>
										Profile
									</Link>
									<Link
										href='/admin/settings'
										className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
									>
										Settings
									</Link>
									<hr className='my-1' />
									<button
										onClick={handleLogout}
										className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
									>
										Դուրս գալ
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Page Content */}
			<main className='p-6'>{children}</main>
		</div>
	)
}
