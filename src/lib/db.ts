import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'
import { User } from '@/types/auth'

export async function getUserByEmail(email: string): Promise<User | null> {
	try {
		console.log('Querying user with email:', email) 
		const result = await sql<User>`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `
		console.log('Query result:', result.rows.length, 'users found') 
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
