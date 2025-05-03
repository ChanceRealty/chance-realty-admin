export interface User {
	id: number
	email: string
	password: string 
	role: 'admin' | 'user'
	created_at: Date
	updated_at: Date
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface AuthResponse {
	token: string
	user: Omit<User, 'password'>
}
