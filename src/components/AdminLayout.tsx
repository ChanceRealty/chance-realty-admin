// src/components/AdminLayout.tsx - Fixed to show user email
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface AdminLayoutProps {
	children: React.ReactNode
}

interface UserInfo {
	id: number
	email: string
	role: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const router = useRouter()

	// Get user info from token on component mount
	useEffect(() => {
		const getUserInfo = async () => {
			try {
				// Get token from cookie and decode it to get user info
				const response = await fetch('/api/auth/me', {
					method: 'GET',
					credentials: 'include',
				})

				if (response.ok) {
					const userData = await response.json()
					setUserInfo(userData.user)
				} else {
					// If can't get user info, try to extract from JWT token
					const token = document.cookie
						.split('; ')
						.find(row => row.startsWith('token='))
						?.split('=')[1]

					if (token) {
						try {
							// Decode JWT token (basic decoding, not verification)
							const base64Url = token.split('.')[1]
							const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
							const jsonPayload = decodeURIComponent(
								atob(base64)
									.split('')
									.map(
										c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
									)
									.join('')
							)
							const decoded = JSON.parse(jsonPayload)
							setUserInfo({
								id: decoded.id,
								email: decoded.email,
								role: decoded.role,
							})
						} catch (error) {
							console.error('Error decoding token:', error)
						}
					}
				}
			} catch (error) {
				console.error('Error getting user info:', error)
			} finally {
				setLoading(false)
			}
		}

		getUserInfo()
	}, [])

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

	const getInitials = (email: string) => {
		if (!email) return 'A'
		const parts = email.split('@')[0]
		return parts.charAt(0).toUpperCase()
	}

	const displayName = userInfo?.email || 'Ադմինիստրատոր'
	const initials = userInfo?.email ? getInitials(userInfo.email) : 'A'

	return (
		<div className='min-h-screen bg-gray-100'>
			{/* Top Navigation */}
			<header className='bg-white shadow-sm'>
				<div className='flex items-center justify-between px-4 py-3'>
					<div className='flex items-center space-x-4'>
						<Link href='/admin' className='text-xl font-bold text-gray-800'>
							Chance Realty Admin
						</Link>
					</div>
					<div className='flex items-center space-x-4 ml-auto'>
						{/* Profile Menu */}
						<div className='relative'>
							<button
								onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
								className='flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100'
							>
								<div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
									<span className='text-white font-medium text-sm'>
										{initials}
									</span>
								</div>
								<span className='hidden md:inline text-gray-700 max-w-48 truncate'>
									{loading ? 'Բեռնվում է...' : displayName}
								</span>
								<ChevronDown className='w-4 h-4 text-gray-700' />
							</button>

							{isProfileMenuOpen && (
								<div className='absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-50 border'>
									{userInfo && (
										<div className='px-4 py-3 border-b border-gray-200'>
											<div className='text-sm text-gray-900 font-medium truncate'>
												{userInfo.email}
											</div>
											<div className='text-xs text-gray-500 capitalize'>
												{userInfo.role} ադմինիստրատոր
											</div>
										</div>
									)}
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
