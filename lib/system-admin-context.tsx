"use client"

/**
 * System Admin Context
 * 
 * Provides state management and API functions for system administration.
 * This context wraps the API functions and provides caching, loading states, and error handling.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { 
  AdminUser, 
  QueryAdminUsersDto, 
  CreateAdminUserDto, 
  UpdateAdminUserDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
  LockAccountDto,
  ActiveSession,
  QueryActiveSessionsDto,
  ActivityLog,
  QueryActivityLogsDto,
  PaginatedResponse
} from "./types"
import * as systemAdminAPI from "./system-admin-api"

interface SystemAdminContextType {
  // State
  users: AdminUser[]
  loading: boolean
  error: string | null

  // User Management Operations
  fetchUsers: (filters?: QueryAdminUsersDto) => Promise<PaginatedResponse<AdminUser> | null>
  getUser: (id: string) => Promise<AdminUser | null>
  createUser: (userData: CreateAdminUserDto) => Promise<AdminUser>
  updateUser: (id: string, userData: UpdateAdminUserDto) => Promise<AdminUser>
  updateUserStatus: (id: string, statusData: UpdateUserStatusDto) => Promise<AdminUser>
  resetPassword: (id: string, passwordData: ResetPasswordDto) => Promise<void>
  forcePasswordChange: (id: string) => Promise<AdminUser>
  lockAccount: (id: string, lockData: LockAccountDto) => Promise<AdminUser>
  unlockAccount: (id: string) => Promise<AdminUser>
  deleteUser: (id: string) => Promise<void>
  getUserActivityLogs: (id: string, page?: number, limit?: number) => Promise<PaginatedResponse<ActivityLog> | null>

  // Session Management Operations
  fetchActiveSessions: (filters?: QueryActiveSessionsDto) => Promise<PaginatedResponse<ActiveSession> | null>
  revokeSession: (token: string, reason?: string) => Promise<void>
  forceLogoutAllUsers: () => Promise<void>

  // Activity Logs Operations
  fetchActivityLogs: (filters?: QueryActivityLogsDto) => Promise<PaginatedResponse<ActivityLog> | null>

  // Helper functions
  getUserById: (id: string) => AdminUser | undefined
  clearError: () => void
}

const SystemAdminContext = createContext<SystemAdminContextType | undefined>(undefined)

/**
 * System Admin Provider Component
 * 
 * Wraps the application to provide system admin state and API functions.
 * All operations require appropriate permissions.
 */
export function SystemAdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Fetch all admin users with optional filters
   * 
   * @param filters - Optional filters (search, role, status, includeDeleted, page, limit)
   */
  const fetchUsers = useCallback(async (filters?: QueryAdminUsersDto): Promise<PaginatedResponse<AdminUser> | null> => {
    try {
      setLoading(true)
      setError(null)
      const response = await systemAdminAPI.getAdminUsers(filters)
      setUsers(response.data || [])
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch admin users'
      setError(errorMessage)
      console.error('Error fetching admin users:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a single user by ID (from API)
   * 
   * @param id - User ID
   * @returns User or null if not found
   */
  const getUser = useCallback(async (id: string): Promise<AdminUser | null> => {
    try {
      setLoading(true)
      setError(null)
      const user = await systemAdminAPI.getAdminUserById(id)
      
      // Update the user in the local state if it exists
      setUsers(prev => {
        const index = prev.findIndex(u => u._id === id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = user
          return updated
        }
        return [...prev, user]
      })
      
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user'
      setError(errorMessage)
      console.error('Error fetching user:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new admin user
   * 
   * @param userData - User creation data
   * @returns Created user
   */
  const createUser = useCallback(async (userData: CreateAdminUserDto): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const newUser = await systemAdminAPI.createAdminUser(userData)
      
      // Add the new user to the local state
      setUsers(prev => [newUser, ...prev])
      
      return newUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      console.error('Error creating user:', err)
      throw err // Re-throw so component can handle it
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update an existing admin user
   * 
   * @param id - User ID
   * @param userData - Partial user data to update
   * @returns Updated user
   */
  const updateUser = useCallback(async (
    id: string,
    userData: UpdateAdminUserDto
  ): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await systemAdminAPI.updateAdminUser(id, userData)
      
      // Update the user in the local state
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u))
      
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      console.error('Error updating user:', err)
      throw err // Re-throw so component can handle it
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update user status
   * 
   * @param id - User ID
   * @param statusData - Status update data
   * @returns Updated user
   */
  const updateUserStatus = useCallback(async (
    id: string,
    statusData: UpdateUserStatusDto
  ): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await systemAdminAPI.updateUserStatus(id, statusData)
      
      // Update the user in the local state
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u))
      
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status'
      setError(errorMessage)
      console.error('Error updating user status:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Reset user password
   * 
   * @param id - User ID
   * @param passwordData - Password reset data
   */
  const resetPassword = useCallback(async (
    id: string,
    passwordData: ResetPasswordDto
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await systemAdminAPI.resetUserPassword(id, passwordData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
      console.error('Error resetting password:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Force password change on next login
   * 
   * @param id - User ID
   * @returns Updated user
   */
  const forcePasswordChange = useCallback(async (id: string): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await systemAdminAPI.forcePasswordChange(id)
      
      // Update the user in the local state
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u))
      
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to force password change'
      setError(errorMessage)
      console.error('Error forcing password change:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Lock user account
   * 
   * @param id - User ID
   * @param lockData - Lock account data
   * @returns Updated user
   */
  const lockAccount = useCallback(async (
    id: string,
    lockData: LockAccountDto
  ): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await systemAdminAPI.lockUserAccount(id, lockData)
      
      // Update the user in the local state
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u))
      
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lock account'
      setError(errorMessage)
      console.error('Error locking account:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Unlock user account
   * 
   * @param id - User ID
   * @returns Updated user
   */
  const unlockAccount = useCallback(async (id: string): Promise<AdminUser> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await systemAdminAPI.unlockUserAccount(id)
      
      // Update the user in the local state
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u))
      
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock account'
      setError(errorMessage)
      console.error('Error unlocking account:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Delete admin user (soft delete)
   * 
   * @param id - User ID
   */
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await systemAdminAPI.deleteAdminUser(id)
      
      // Remove the user from the local state
      setUsers(prev => prev.filter(u => u._id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      console.error('Error deleting user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get user activity logs
   * 
   * @param id - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated activity logs
   */
  const getUserActivityLogs = useCallback(async (
    id: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<ActivityLog> | null> => {
    try {
      setLoading(true)
      setError(null)
      return await systemAdminAPI.getUserActivityLogs(id, page, limit)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs'
      setError(errorMessage)
      console.error('Error fetching activity logs:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch active sessions
   * 
   * @param filters - Optional filters
   * @returns Paginated active sessions
   */
  const fetchActiveSessions = useCallback(async (
    filters?: QueryActiveSessionsDto
  ): Promise<PaginatedResponse<ActiveSession> | null> => {
    try {
      setLoading(true)
      setError(null)
      return await systemAdminAPI.getActiveSessions(filters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active sessions'
      setError(errorMessage)
      console.error('Error fetching active sessions:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Revoke a session
   * 
   * @param token - Session token
   * @param reason - Reason for revocation
   */
  const revokeSession = useCallback(async (token: string, reason?: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await systemAdminAPI.revokeSession(token, reason)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke session'
      setError(errorMessage)
      console.error('Error revoking session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Force logout all users (emergency)
   */
  const forceLogoutAllUsers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await systemAdminAPI.forceLogoutAllUsers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to force logout all users'
      setError(errorMessage)
      console.error('Error forcing logout all users:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch activity logs
   * 
   * @param filters - Optional filters
   * @returns Paginated activity logs
   */
  const fetchActivityLogs = useCallback(async (
    filters?: QueryActivityLogsDto
  ): Promise<PaginatedResponse<ActivityLog> | null> => {
    try {
      setLoading(true)
      setError(null)
      return await systemAdminAPI.getActivityLogs(filters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs'
      setError(errorMessage)
      console.error('Error fetching activity logs:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a user from local state by ID (synchronous)
   * 
   * @param id - User ID
   * @returns User or undefined if not found
   */
  const getUserById = useCallback((id: string): AdminUser | undefined => {
    return users.find(u => u._id === id)
  }, [users])

  return (
    <SystemAdminContext.Provider
      value={{
        users,
        loading,
        error,
        fetchUsers,
        getUser,
        createUser,
        updateUser,
        updateUserStatus,
        resetPassword,
        forcePasswordChange,
        lockAccount,
        unlockAccount,
        deleteUser,
        getUserActivityLogs,
        fetchActiveSessions,
        revokeSession,
        forceLogoutAllUsers,
        fetchActivityLogs,
        getUserById,
        clearError,
      }}
    >
      {children}
    </SystemAdminContext.Provider>
  )
}

/**
 * Hook to use the System Admin Context
 * 
 * @returns SystemAdminContextType
 * @throws Error if used outside SystemAdminProvider
 */
export function useSystemAdmin() {
  const context = useContext(SystemAdminContext)
  if (context === undefined) {
    throw new Error("useSystemAdmin must be used within a SystemAdminProvider")
  }
  return context
}

