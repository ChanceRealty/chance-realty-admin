'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')
		console.log('Submitting login with:', { email, password }) 

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
				credentials: 'include',
			})

			console.log('Response status:', response.status) 
			const data = await response.json()
			console.log('Response data:', data) 

			if (!response.ok) {
				throw new Error(data.error || 'Failed to login')
			}

						router.push('/admin')

		} catch (err) {
			console.error('Login error:', err) 
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
						Ադմինիստրատորի մուտք
					</h2>
				</div>
				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					{error && (
						<div className='rounded-md bg-red-50 p-4'>
							<div className='text-sm text-red-700'>{error}</div>
						</div>
					)}
					<div className='rounded-md shadow-sm -space-y-px'>
						<div>
							<label htmlFor='email' className='sr-only'>
								Email address
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								required
								className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
								placeholder='Email address'
								value={email}
								onChange={e => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor='password' className='sr-only'>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								autoComplete='current-password'
								required
								className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
								placeholder='Password'
								value={password}
								onChange={e => setPassword(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
						>
							{isLoading ? 'Նույնականացում...' : 'Մուտք գործել'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
