"use client"

import type React from "react"
import { useHasPermission, useHasRole } from "@/lib/api/hooks"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface PermissionGuardProps {
  children: React.ReactNode
  resource?: string
  action?: string
  roles?: string[]
  fallback?: React.ReactNode
}

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions or roles
 */
export function PermissionGuard({
  children,
  resource,
  action,
  roles,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission: permissionCheck, isLoading: permissionLoading } =
    useHasPermission(resource || "", action || "")
  const { hasRole: roleCheck, isLoading: roleLoading } = useHasRole(roles || [])

  const isLoading = permissionLoading || roleLoading

  // If checking permission (primary use case)
  if (resource && action) {
    if (isLoading) {
      return <div className="animate-pulse h-10 bg-muted rounded" />
    }

    if (!permissionCheck) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to {action} {resource}.
          </AlertDescription>
        </Alert>
      )
    }

    return <>{children}</>
  }

  // If checking role
  if (roles && roles.length > 0) {
    if (isLoading) {
      return <div className="animate-pulse h-10 bg-muted rounded" />
    }

    if (!roleCheck) {
      return fallback ? (
        <>{fallback}</>
      ) : (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have the required role to access this feature.
          </AlertDescription>
        </Alert>
      )
    }

    return <>{children}</>
  }

  // No restrictions, render children
  return <>{children}</>
}

/**
 * HOC for permission-based rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string,
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard resource={resource} action={action}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * HOC for role-based rendering
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  roles: string[],
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <PermissionGuard roles={roles}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

