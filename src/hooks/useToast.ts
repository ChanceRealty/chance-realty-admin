// src/hooks/useToast.ts
import { useState, useCallback } from 'react'
import { ToastType } from '@/components/Toast'

interface ToastItem {
	id: string
	message: string
	type: ToastType
	persist?: boolean // Add persist flag
}

export function useToast() {
	const [toasts, setToasts] = useState<ToastItem[]>([])

	const addToast = useCallback(
		(message: string, type: ToastType = 'info', persist = false) => {
			const id = Math.random().toString(36).substring(7)
			setToasts(prev => [...prev, { id, message, type, persist }])
			return id
		},
		[]
	)

	const removeToast = useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id))
	}, [])

	const showSuccess = useCallback(
		(message: string, persist = false) => addToast(message, 'success', persist),
		[addToast]
	)

	const showError = useCallback(
		(message: string, persist = false) => addToast(message, 'error', persist),
		[addToast]
	)

	const showWarning = useCallback(
		(message: string, persist = false) => addToast(message, 'warning', persist),
		[addToast]
	)

	const showInfo = useCallback(
		(message: string, persist = false) => addToast(message, 'info', persist),
		[addToast]
	)

	return {
		toasts,
		removeToast,
		showSuccess,
		showError,
		showWarning,
		showInfo,
	}
}
