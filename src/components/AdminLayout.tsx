// src/components/AdminLayout.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
	LayoutDashboard,
	Users,
	Settings,
	FileText,
	BarChart3,
	LogOut,
	Menu,
	X,
	Bell,
	Search,
	ChevronDown,
	Home,
} from 'lucide-react'

interface AdminLayoutProps {
	children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true)
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

	const sidebarItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
		{ icon: Home, label: 'Properties', href: '/admin/properties' },
		{ icon: Users, label: 'Users', href: '/admin/users' },
		{ icon: FileText, label: 'Content', href: '/admin/content' },
		{ icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
		{ icon: Settings, label: 'Settings', href: '/admin/settings' },
	]

	return (
		<div className='min-h-screen bg-gray-100'>
			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} bg-gray-900 text-white w-64`}
			>
				<div className='flex items-center justify-between p-4 border-b border-gray-800'>
					<h1 className='text-xl font-bold'>Admin Panel</h1>
					<button
						onClick={() => setIsSidebarOpen(false)}
						className='p-2 rounded-lg hover:bg-gray-800 lg:hidden'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				<nav className='p-4 space-y-2'>
					{sidebarItems.map(item => (
						<Link
							key={item.href}
							href={item.href}
							className='flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors'
						>
							<item.icon className='w-5 h-5' />
							<span>{item.label}</span>
						</Link>
					))}
				</nav>

				<div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800'>
					<button
						onClick={handleLogout}
						className='flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors w-full text-red-400 hover:text-red-300'
					>
						<LogOut className='w-5 h-5' />
						<span>Logout</span>
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<div className={`${isSidebarOpen ? 'lg:ml-64' : ''}`}>
				{/* Top Navigation */}
				<header className='bg-white shadow-sm'>
					<div className='flex items-center justify-between px-4 py-3'>
						<button
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							className='p-2 rounded-lg hover:bg-gray-100'
						>
							<Menu className='w-6 h-6' />
						</button>

						<div className='flex items-center space-x-4'>
							{/* Search Bar */}
							<div className='hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2'>
								<Search className='w-5 h-5 text-gray-500' />
								<input
									type='text'
									placeholder='Search...'
									className='bg-transparent border-0 focus:outline-none ml-2 w-64'
								/>
							</div>

							{/* Notifications */}
							<button className='p-2 rounded-lg hover:bg-gray-100 relative'>
								<Bell className='w-6 h-6' />
								<span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
							</button>

							{/* Profile Menu */}
							<div className='relative'>
								<button
									onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
									className='flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100'
								>
									<div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
										<span className='text-gray-600 font-medium'>A</span>
									</div>
									<span className='hidden md:inline'>Admin</span>
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
											Logout
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

			{/* Overlay for mobile */}
			{isSidebarOpen && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden'
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}
		</div>
	)
}
