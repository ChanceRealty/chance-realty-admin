// src/middleware/cors.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function corsMiddleware(request: NextRequest) {
	// Check if this is a preflight request
	const isPreflight = request.method === 'OPTIONS'

	// Get the origin from the request
	const origin = request.headers.get('origin') || '*'

	// Define allowed origins (you can make this more restrictive)
	const allowedOrigins = [
		'http://localhost:3001',
		'https://chance-realty-frontend.vercel.app',
	]

	// Check if the origin is allowed (or use '*' to allow all)
	const allowOrigin = allowedOrigins.includes(origin) ? origin : '*'

	// Create the response
	const response = isPreflight
		? new NextResponse(null, { status: 204 })
		: NextResponse.next()

	// Add CORS headers
	response.headers.set('Access-Control-Allow-Origin', allowOrigin)
	response.headers.set(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS'
	)
	response.headers.set(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization'
	)
	response.headers.set('Access-Control-Max-Age', '86400')

	return response
}
