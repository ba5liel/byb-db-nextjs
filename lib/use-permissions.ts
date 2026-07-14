"use client"

/**
 * Permission Check Hook
 *
 * Answers permission questions from the authenticated session (auth-context).
 * The old implementation POSTed to /api/admin/permissions/check, a backend
 * route that does not exist (404) — do not reintroduce it.
 */

import { useCallback } from "react"
import { useAuth } from "./auth-context"

/**
 * Hook to check user permissions.
 *
 * @returns Object with checkPermission function and loading state
 */
export function usePermissions() {
  const { user, session, loading } = useAuth()
  const role = user?.role
  const sessionPermissions = (session as { permissions?: Record<string, string[]> } | null)
    ?.permissions

  /**
   * Check if the current user has ALL of the given permissions,
   * e.g. checkPermission({ user: ["list"] }).
   * Kept async for backward compatibility with existing callers.
   */
  const checkPermission = useCallback(
    async (permissions: Record<string, string[]>): Promise<boolean> => {
      // superAdmin has full access (mirrors the backend PermissionsGuard bypass)
      if (role === "superAdmin") return true
      if (!sessionPermissions) return false

      return Object.entries(permissions).every(([resource, actions]) => {
        const granted = sessionPermissions[resource] || []
        return actions.every((action) => granted.includes(action))
      })
    },
    [role, sessionPermissions],
  )

  return { checkPermission, loading }
}
