"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"
import { Resource, Action } from "@/lib/permissions"

interface PermissionGuardProps {
  children: React.ReactNode
  resource?: Resource
  action?: Action
  fallback?: React.ReactNode
  showError?: boolean
}

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 * Uses session-based permissions for synchronous checks (no loading state!)
 */
export function PermissionGuard({
  children,
  resource,
  action,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth()

  // Show loading state only during initial session check
  if (loading) {
    return <div className="animate-pulse h-10 bg-muted rounded" />
  }

  // If no resource/action specified, render children (no restriction)
  if (!resource || !action) {
    return <>{children}</>
  }

  // Check permission synchronously from session
  const hasAccess = hasPermission(resource, action)

  if (!hasAccess) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Show error alert if showError is true
    if (showError) {
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to perform the action &quot;{action}&quot; on resource &quot;{resource}&quot;.
          </AlertDescription>
        </Alert>
      )
    }

    // Don't render anything if showError is false
    return null
  }

  // User has permission, render children
  return <>{children}</>
}

/**
 * HOC for permission-based rendering
 * Wraps a component with permission check
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: Resource,
  action: Action,
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
 * Permission Button - Only shows button if user has permission
 * Useful for action buttons like Create, Edit, Delete
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resource: Resource
  action: Action
  children: React.ReactNode
}

export function PermissionButton({
  resource,
  action,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(resource, action)) {
    return null
  }

  return <button {...buttonProps}>{children}</button>
}

/**
 * Hook to check if user has permission (using context)
 * @deprecated Use useAuth().hasPermission() directly instead
 */
export function useHasPermissionGuard(resource: Resource, action: Action): boolean {
  const { hasPermission } = useAuth()
  return hasPermission(resource, action)
}
