/**
 * Roles API Service
 * Handles all role management API calls
 */

import { apiClient } from '../client'
import type {
  Role,
  RolesListResponse,
  PermissionsResponse,
  CurrentUserRole,
  RoleConstantsResponse,
  ApiResponse,
} from '../types'

const ROLES_BASE_URL = '/api/roles'

/**
 * Get all roles
 */
export async function getRoles(): Promise<RolesListResponse> {
  const response = await apiClient.get<ApiResponse<RolesListResponse>>(ROLES_BASE_URL)
  console.log('response', response)
  return response.data.data
}

/**
 * Get all available permissions/resources
 */
export async function getPermissions(): Promise<PermissionsResponse> {
  const response = await apiClient.get<ApiResponse<PermissionsResponse>>(`${ROLES_BASE_URL}/permissions`)
  return response.data.data
}

/**
 * Get current user's role and permissions
 */
export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const response = await apiClient.get<ApiResponse<CurrentUserRole>>(`${ROLES_BASE_URL}/me`)
  return response.data.data
}

/**
 * Get role constants (for frontend use)
 */
export async function getRoleConstants(): Promise<RoleConstantsResponse> {
  const response = await apiClient.get<ApiResponse<RoleConstantsResponse>>(`${ROLES_BASE_URL}/constants`)
  return response.data.data
}

