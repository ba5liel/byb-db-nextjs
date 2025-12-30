/**
 * Authentication-related DTOs
 */

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface UserDto {
  id: string
  email: string
  name: string
  role: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SessionDto {
  session: {
    id: string
    userId: string
    expiresAt: string
    token: string
    ipAddress?: string
    userAgent?: string
  }
  user: UserDto
}

