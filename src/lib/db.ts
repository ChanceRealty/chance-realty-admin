'use server'

import { Pool, PoolClient } from 'pg'
import bcrypt from 'bcryptjs'
import { User } from '@/types/auth'
// Singleton pool instance
let pool: Pool | null = null

function getPool(): Pool {
	if (!pool) {
		pool = new Pool({
			connectionString: process.env.POSTGRES_URL,
			ssl: {
				rejectUnauthorized: false,
			},
			max: 10, // max connections
			idleTimeoutMillis: 30000, // close idle clients after 30s
			connectionTimeoutMillis: 10000, // timeout for new connections
		})

		pool.on('error', err => {
			console.error('Unexpected pool error:', err)
		})

		// Log pool stats periodically in development
		if (process.env.NODE_ENV === 'development') {
			setInterval(() => {
				console.log('Pool stats:', {
					total: pool?.totalCount,
					idle: pool?.idleCount,
					waiting: pool?.waitingCount,
				})
			}, 60000)
		}
	}

	return pool
}

export async function query(text: string, params?: any[]) {
	const pool = getPool()
	const start = Date.now()

	try {
		const result = await pool.query(text, params)
		const duration = Date.now() - start

		if (duration > 1000) {
			console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100))
		}

		return result
	} catch (error) {
		console.error('Query error:', error)
		throw error
	}
}

// Transaction helper
export async function transaction<T>(
	callback: (client: PoolClient) => Promise<T>
): Promise<T> {
	const pool = getPool()
	const client = await pool.connect()

	try {
		await client.query('BEGIN')
		const result = await callback(client)
		await client.query('COMMIT')
		return result
	} catch (error) {
		await client.query('ROLLBACK')
		throw error
	} finally {
		client.release()
	}
}

// Graceful shutdown
export async function closePool() {
	if (pool) {
		await pool.end()
		pool = null
	}
}

export async function getUserByEmail(email: string): Promise<User | null> {
	try {
		console.log('Querying user with email:', email)
		const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [
			email,
		])
		return result.rows[0] || null
	} catch (error) {
		console.error('Failed to fetch user:', error)
		throw new Error('Failed to fetch user')
	}
}

export async function verifyPassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	try {
		console.log('Comparing passwords...')
		const result = await bcrypt.compare(password, hashedPassword)
		console.log('Password comparison result:', result)
		return result
	} catch (error) {
		console.error('Password verification error:', error)
		return false
	}
}
