/**
 * System Admin API
 * 
 * This module provides all API functions for system administration,
 * including user management, session management, and activity logs.
 * All endpoints require appropriate permissions.
 * 
 * Base URL: Configure via NEXT_PUBLIC_API_URL environment variable (defaults to http://localhost:3000)
 */

import type { AdminUser, AdminUserRole, AdminUserStatus, ActiveSession, ActivityLog } from "./types"

// API Base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Helper function to make authenticated API requests
 * Automatically includes credentials (cookies) for session-based auth
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important for cookie-based authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Handle error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data || data // Return data field if present, otherwise return entire response
}

// ============================================================================
// Type Definitions (re-exported from types.ts for convenience)
// ============================================================================

// Types are imported from ./types.ts

/**
 * Create Admin User DTO
 */
export interface CreateAdminUserDto {
  username: string
  fullName: string
  email: string
  phoneNumber?: string
  password: string
  role: AdminUserRole
  ministerId?: string
  memberId?: string
  customPrivileges?: string[]
  deniedPrivileges?: string[]
  sendCredentialsSms?: boolean
  sendCredentialsEmail?: boolean
}

/**
 * Update Admin User DTO
 */
export interface UpdateAdminUserDto {
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: AdminUserRole
  ministerId?: string
  memberId?: string
  customPrivileges?: string[]
  deniedPrivileges?: string[]
  notifyOnPasswordChange?: boolean
  notifyOnLogin?: boolean
}

/**
 * Update User Status DTO
 */
export interface UpdateUserStatusDto {
  status: AdminUserStatus
  reason?: string
}

/**
 * Reset Password DTO
 */
export interface ResetPasswordDto {
  newPassword: string
  forcePasswordChange?: boolean
  sendViaSms?: boolean
  sendViaEmail?: boolean
}

/**
 * Lock Account DTO
 */
export interface LockAccountDto {
  reason: string
  lockDurationMinutes?: number
}

/**
 * Query Admin Users DTO
 */
export interface QueryAdminUsersDto {
  search?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  includeDeleted?: boolean
  page?: number
  limit?: number
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ActiveSession type is imported from ./types.ts

/**
 * Query Active Sessions DTO
 */
export interface QueryActiveSessionsDto {
  userId?: string
  page?: number
  limit?: number
}

// ActivityLog type is imported from ./types.ts

/**
 * Query Activity Logs DTO
 */
export interface QueryActivityLogsDto {
  userId?: string
  action?: string
  resource?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// ============================================================================
// Admin User Management API Functions
// ============================================================================

/**
 * Create a new admin user
 * POST /api/system-admin/users
 * Requires: user:create permission
 * 
 * @param userData - User creation data
 * @returns Created admin user
 */
export async function createAdminUser(
  userData: CreateAdminUserDto
): Promise<AdminUser> {
  return apiRequest<AdminUser>('/api/system-admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

/**
 * Get all admin users with optional filters and pagination
 * GET /api/system-admin/users
 * Requires: user:list permission
 * 
 * @param filters - Optional filters (search, role, status, includeDeleted, page, limit)
 * @returns Paginated list of admin users
 */
export async function getAdminUsers(
  filters?: QueryAdminUsersDto
): Promise<PaginatedResponse<AdminUser>> {
  // Build query string
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.role) params.append('role', filters.role)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.includeDeleted !== undefined)
    params.append('includeDeleted', String(filters.includeDeleted))
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const endpoint = `/api/system-admin/users${queryString ? `?${queryString}` : ''}`

  return apiRequest<PaginatedResponse<AdminUser>>(endpoint, {
    method: 'GET',
  })
}

/**
 * Get a single admin user by ID
 * GET /api/system-admin/users/:id
 * Requires: user:read permission
 * 
 * @param userId - Admin user ID
 * @returns Admin user details
 */
export async function getAdminUserById(userId: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/system-admin/users/${userId}`, {
    method: 'GET',
  })
}

/**
 * Update an admin user
 * PUT /api/system-admin/users/:id
 * Requires: user:update permission
 * 
 * @param userId - Admin user ID
 * @param userData - Partial user data to update
 * @returns Updated admin user
 */
export async function updateAdminUser(
  userId: string,
  userData: UpdateAdminUserDto
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/system-admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
}

/**
 * Update user status
 * PATCH /api/system-admin/users/:id/status
 * Requires: user:update permission
 * 
 * @param userId - Admin user ID
 * @param statusData - Status update data
 * @returns Updated admin user
 */
export async function updateUserStatus(
  userId: string,
  statusData: UpdateUserStatusDto
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/system-admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  })
}

/**
 * Reset user password
 * POST /api/system-admin/users/:id/reset-password
 * Requires: user:set-password permission
 * 
 * @param userId - Admin user ID
 * @param passwordData - Password reset data
 * @returns Success response
 */
export async function resetUserPassword(
  userId: string,
  passwordData: ResetPasswordDto
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/system-admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(passwordData),
  })
}

/**
 * Force password change on next login
 * POST /api/system-admin/users/:id/force-password-change
 * Requires: user:update permission
 * 
 * @param userId - Admin user ID
 * @returns Updated admin user
 */
export async function forcePasswordChange(
  userId: string
): Promise<AdminUser> {
  return apiRequest<AdminUser>(
    `/api/system-admin/users/${userId}/force-password-change`,
    {
      method: 'POST',
    }
  )
}

/**
 * Lock user account
 * POST /api/system-admin/users/:id/lock
 * Requires: user:ban permission
 * 
 * @param userId - Admin user ID
 * @param lockData - Lock account data
 * @returns Updated admin user
 */
export async function lockUserAccount(
  userId: string,
  lockData: LockAccountDto
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/system-admin/users/${userId}/lock`, {
    method: 'POST',
    body: JSON.stringify(lockData),
  })
}

/**
 * Unlock user account
 * POST /api/system-admin/users/:id/unlock
 * Requires: user:ban permission
 * 
 * @param userId - Admin user ID
 * @returns Updated admin user
 */
export async function unlockUserAccount(userId: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/system-admin/users/${userId}/unlock`, {
    method: 'POST',
  })
}

/**
 * Delete admin user (soft delete)
 * DELETE /api/system-admin/users/:id
 * Requires: user:delete permission
 * 
 * @param userId - Admin user ID
 * @returns Success response
 */
export async function deleteAdminUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/system-admin/users/${userId}`, {
    method: 'DELETE',
  })
}

/**
 * Get user activity logs
 * GET /api/system-admin/users/:id/activity
 * Requires: user:read permission
 * 
 * @param userId - Admin user ID
 * @param page - Page number
 * @param limit - Items per page
 * @returns Paginated activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  page?: number,
  limit?: number
): Promise<PaginatedResponse<ActivityLog>> {
  const params = new URLSearchParams()
  if (page) params.append('page', String(page))
  if (limit) params.append('limit', String(limit))

  const queryString = params.toString()
  const endpoint = `/api/system-admin/users/${userId}/activity${queryString ? `?${queryString}` : ''}`

  return apiRequest<PaginatedResponse<ActivityLog>>(endpoint, {
    method: 'GET',
  })
}

// ============================================================================
// Session Management API Functions
// ============================================================================

/**
 * Get active sessions
 * GET /api/system-admin/sessions
 * Requires: session:list permission
 * 
 * @param filters - Optional filters (userId, page, limit)
 * @returns Paginated list of active sessions
 */
export async function getActiveSessions(
  filters?: QueryActiveSessionsDto
): Promise<PaginatedResponse<ActiveSession>> {
  const params = new URLSearchParams()
  if (filters?.userId) params.append('userId', filters.userId)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const endpoint = `/api/system-admin/sessions${queryString ? `?${queryString}` : ''}`

  return apiRequest<PaginatedResponse<ActiveSession>>(endpoint, {
    method: 'GET',
  })
}

/**
 * Revoke a session
 * POST /api/system-admin/sessions/:token/revoke
 * Requires: session:revoke permission
 * 
 * @param token - Session token
 * @param reason - Reason for revocation
 * @returns Success response
 */
export async function revokeSession(
  token: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/system-admin/sessions/${token}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  })
}

/**
 * Force logout all users (emergency)
 * POST /api/system-admin/sessions/force-logout-all
 * Requires: session:revoke permission
 * 
 * @returns Success response
 */
export async function forceLogoutAllUsers(): Promise<{
  success: boolean
  message: string
}> {
  return apiRequest('/api/system-admin/sessions/force-logout-all', {
    method: 'POST',
  })
}

// ============================================================================
// Activity Logs API Functions
// ============================================================================

/**
 * Get activity logs
 * GET /api/system-admin/activity-logs
 * Requires: user:list permission
 * 
 * @param filters - Optional filters (userId, action, resource, startDate, endDate, page, limit)
 * @returns Paginated list of activity logs
 */
export async function getActivityLogs(
  filters?: QueryActivityLogsDto
): Promise<PaginatedResponse<ActivityLog>> {
  const params = new URLSearchParams()
  if (filters?.userId) params.append('userId', filters.userId)
  if (filters?.action) params.append('action', filters.action)
  if (filters?.resource) params.append('resource', filters.resource)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const endpoint = `/api/system-admin/activity-logs${queryString ? `?${queryString}` : ''}`

  return apiRequest<PaginatedResponse<ActivityLog>>(endpoint, {
    method: 'GET',
  })
}

// ============================================================================
// Permission Check Utility
// ============================================================================

/**
 * Check if current user has specific permissions
 * POST /api/admin/permissions/check
 * 
 * @param permissions - Permissions to check (e.g., { user: ['create', 'read'] })
 * @returns Whether user has the required permissions
 */
export async function checkPermission(
  permissions: Record<string, string[]>
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/permissions/check`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.hasPermission === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

