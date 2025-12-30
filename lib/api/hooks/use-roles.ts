/**
 * React Query hooks for role management
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { CurrentUserRole } from "../types"
import * as rolesService from "../services/roles.service"
import { authClient } from "@/lib/auth-client"

// Query keys
export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
  currentUser: () => [...roleKeys.all, "current-user"] as const,
  constants: () => [...roleKeys.all, "constants"] as const,
}

/**
 * Hook to fetch all roles
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => rolesService.getRoles(),
  })
}

/**
 * Hook to fetch all available permissions
 */
export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => rolesService.getPermissions(),
  })
}

/**
 * Hook to fetch current user's role and permissions
 */
export function useCurrentUserRole() {
  return useQuery({
    queryKey: roleKeys.currentUser(),
    queryFn: () => rolesService.getCurrentUserRole(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch role constants
 */
export function useRoleConstants() {
  return useQuery({
    queryKey: roleKeys.constants(),
    queryFn: () => rolesService.getRoleConstants(),
    staleTime: Infinity, // These rarely change
  })
}

/**
 * Hook to check if current user has specific permission
 * Uses Better Auth's hasPermission API for server-side validation
 */
export function useHasPermission(
  resource: string,
  action: string,
): { hasPermission: boolean; isLoading: boolean } {
  const [hasPermission, setHasPermission] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function checkPermission() {
      try {
        setIsLoading(true)
        // Use Better Auth's hasPermission API
        const result = await authClient.organization.hasPermission({
          permissions: {
            [resource]: [action],
          },
        })
        setHasPermission(result?.data?.success ?? false)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [resource, action])

  return { hasPermission, isLoading }
}

/**
 * Hook to check if current user has any of the specified roles
 */
export function useHasRole(roles: string[]): { hasRole: boolean; isLoading: boolean } {
  const { data: currentUser, isLoading } = useCurrentUserRole()

  const hasRole = currentUser?.role ? roles.includes(currentUser.role) : false

  return { hasRole, isLoading }
}

/**
 * Hook to get current user's role name
 */
export function useCurrentRole(): { role: string | null; isLoading: boolean } {
  const { data: currentUser, isLoading } = useCurrentUserRole()

  return { role: currentUser?.role ?? null, isLoading }
}

