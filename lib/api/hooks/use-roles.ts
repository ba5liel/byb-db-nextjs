import { useQuery } from "@tanstack/react-query"
import { getRoles, getPermissions } from "../services"

/**
 * Query keys for roles and permissions
 */
export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
}

/**
 * Hook to fetch all roles from Better Auth
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => getRoles(),
  })
}

/**
 * Hook to fetch all available permissions/resources
 */
export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => getPermissions(),
  })
}
