/**
 * Authentication API
 * 
 * This module provides all API functions for user authentication.
 * Uses Better Auth on the backend with session cookie-based authentication.
 * 
 * Base URL: Configure via NEXT_PUBLIC_API_URL environment variable (defaults to http://localhost:3000)
 */

// API Base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Sign up a new user
 * POST /api/auth/sign-up/email
 * 
 * @param email - User email address
 * @param password - User password
 * @param name - User full name
 * @returns User data and session cookie
 */
export async function signUp(email: string, password: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    credentials: 'include', // Important for cookie-based authentication
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Sign up failed' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

/**
 * Sign in an existing user
 * POST /api/auth/sign-in/email
 * 
 * @param email - User email address
 * @param password - User password
 * @returns User data and session cookie
 */
export async function signIn(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    credentials: 'include', // Important for cookie-based authentication
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Sign in failed' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

/**
 * Sign out the current user
 * POST /api/auth/sign-out
 * 
 * Clears the session cookie on the server
 */
export async function signOut() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    // Log error but don't throw - user should still be logged out on client side
    console.error('Error signing out:', error)
  }
}

/**
 * Get the current user session
 * GET /api/auth/get-session
 * 
 * @returns Current user data if authenticated, null otherwise
 */
export async function getSession() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based authentication
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

