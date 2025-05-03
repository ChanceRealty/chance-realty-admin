import jwt from 'jsonwebtoken'
import { User } from '@/types/auth'

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET!
const JWT_EXPIRES_IN = process.env.NEXT_PUBLIC_JWT_EXPIRES_IN || '24h'

export function generateToken(user: Omit<User, 'password'>): string {
	if (!JWT_SECRET) {
		throw new Error('JWT_SECRET is not defined')
	}

	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			role: user.role,
		},
		JWT_SECRET as jwt.Secret,
		{ expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
	)
}

export function verifyToken(
	token: string
): { id: number; email: string; role: string } | null {
	if (!JWT_SECRET) {
		throw new Error('JWT_SECRET is not defined')
	}

	try {
		return jwt.verify(token, JWT_SECRET as jwt.Secret) as {
			id: number
			email: string
			role: string
		}
	} catch (error) {
		return null
	}
}
