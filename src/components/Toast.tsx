// src/components/Toast.tsx
'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
	message: string
	type: ToastType
	onClose: () => void
	duration?: number
}

export default function Toast({
	message,
	type,
	onClose,
	duration = 5000,
}: ToastProps) {
	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(onClose, duration)
			return () => clearTimeout(timer)
		}
	}, [duration, onClose])

	const icons = {
		success: <CheckCircle className='w-5 h-5' />,
		error: <XCircle className='w-5 h-5' />,
		warning: <AlertCircle className='w-5 h-5' />,
		info: <Info className='w-5 h-5' />,
	}

	const styles = {
		success: 'bg-green-50 border-green-500 text-green-800',
		error: 'bg-red-50 border-red-500 text-red-800',
		warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
		info: 'bg-blue-50 border-blue-500 text-blue-800',
	}

	const iconColors = {
		success: 'text-green-500',
		error: 'text-red-500',
		warning: 'text-yellow-500',
		info: 'text-blue-500',
	}

	return (
		<div
			className={`fixed top-4 right-4 z-50 flex items-start gap-3 min-w-[300px] max-w-md p-4 rounded-lg border-l-4 shadow-lg animate-slide-in ${styles[type]}`}
		>
			<div className={`flex-shrink-0 ${iconColors[type]}`}>{icons[type]}</div>
			<p className='flex-1 text-sm font-medium'>{message}</p>
			<button
				onClick={onClose}
				className='flex-shrink-0 hover:opacity-70 transition-opacity'
			>
				<X className='w-4 h-4' />
			</button>
		</div>
	)
}

// Toast Container Component
interface ToastContainerProps {
	toasts: Array<{ id: string; message: string; type: ToastType }>
	onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
	return (
		<div className='fixed top-4 right-4 z-50 space-y-2'>
			{toasts.map(toast => (
				<Toast
					key={toast.id}
					message={toast.message}
					type={toast.type}
					onClose={() => onRemove(toast.id)}
				/>
			))}
		</div>
	)
}
