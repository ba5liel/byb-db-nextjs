"use client"

/**
 * Permission Check Hook
 * 
 * Provides utilities to check user permissions for role-based access control.
 * Uses the backend permission check endpoint.
 */

import { useState, useCallback } from "react"
import { checkPermission as checkPermissionAPI } from "./system-admin-api"

/**
 * Hook to check user permissions
 * 
 * @returns Object with checkPermission function and loading state
 */
export function usePermissions() {
  const [loading, setLoading] = useState(false)

  /**
   * Check if current user has specific permissions
   * 
   * @param permissions - Permissions to check (e.g., { user: ['create', 'read'] })
   * @returns Promise<boolean> - Whether user has the required permissions
   */
  const checkPermission = useCallback(
    async (permissions: Record<string, string[]>): Promise<boolean> => {
      setLoading(true)
      try {
        return await checkPermissionAPI(permissions)
      } catch (error) {
        console.error("Error checking permission:", error)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { checkPermission, loading }
}

