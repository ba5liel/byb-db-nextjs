/**
 * Users API Service
 * Handles all user management API calls
 */

import { apiClient } from '../client'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  AssignRoleDto,
  ResetPasswordDto,
  BanUserDto,
  UserListResponse,
  ApiResponse,
} from '../types'

const USERS_BASE_URL = '/api/admin/users'

/**
 * Get all users
 */
export async function getUsers(): Promise<UserListResponse> {
  const response = await apiClient.get<ApiResponse<UserListResponse>>(USERS_BASE_URL)
  return response.data.data
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>(`${USERS_BASE_URL}/${userId}`)
  return response.data.data
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>(USERS_BASE_URL, data)
  return response.data.data
}

/**
 * Update user
 */
export async function updateUser(userId: string, data: UpdateUserDto): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>(`${USERS_BASE_URL}/${userId}`, data)
  return response.data.data
}

/**
 * Assign role to user
 */
export async function assignRole(userId: string, data: AssignRoleDto): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>(`${USERS_BASE_URL}/${userId}/role`, data)
  return response.data.data
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: string,
  data: ResetPasswordDto,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
    `${USERS_BASE_URL}/${userId}/reset-password`,
    data,
  )
  return response.data.data
}

/**
 * Revoke all user sessions (force logout)
 */
export async function revokeUserSessions(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
    `${USERS_BASE_URL}/${userId}/revoke-sessions`,
  )
  return response.data.data
}

/**
 * Ban user
 */
export async function banUser(
  userId: string,
  data: BanUserDto,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
    `${USERS_BASE_URL}/${userId}/ban`,
    data,
  )
  return response.data.data
}

/**
 * Unban user
 */
export async function unbanUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
    `${USERS_BASE_URL}/${userId}/unban`,
  )
  return response.data.data
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
    `${USERS_BASE_URL}/${userId}/delete`,
  )
  return response.data.data
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<any> {
  const response = await apiClient.get('/api/admin/session')
  return response.data
}

/**
 * Check user permissions
 */
export async function checkPermission(
  permissions: Record<string, string[]>,
): Promise<{ success: boolean; hasPermission: boolean }> {
  const response = await apiClient.post<{ success: boolean; hasPermission: boolean }>(
    '/api/admin/check-permission',
    { permissions },
  )
  return response.data
}

