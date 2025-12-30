/**
 * Client-Side Route Protection Components
 * 
 * Use these to protect routes and components on the client side
 */

"use client"

import { useAuth, useOrgPermission } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode
}

/**
 * Protects a route by requiring authentication
 * Redirects to login if not authenticated
 * 
 * @example
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <DashboardContent />
 *     </ProtectedRoute>
 *   )
 * }
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading, router, redirectTo])

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

interface ProtectedOrgRouteProps {
  children: ReactNode
  resource: string
  actions: string[]
  fallback?: ReactNode
}

/**
 * Protects a route by requiring specific organization permissions
 * Shows error message if user doesn't have permission
 * 
 * @example
 * export default function CreateMemberPage() {
 *   return (
 *     <ProtectedRoute>
 *       <ProtectedOrgRoute resource="member" actions={["create"]}>
 *         <CreateMemberForm />
 *       </ProtectedOrgRoute>
 *     </ProtectedRoute>
 *   )
 * }
 */
export function ProtectedOrgRoute({
  children,
  resource,
  actions,
  fallback,
}: ProtectedOrgRouteProps) {
  const { hasPermission, loading } = useOrgPermission(resource, actions)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Checking permissions...
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      fallback || (
        <Alert variant="destructive" className="m-6">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Required permissions:{" "}
            {actions.join(", ")} on {resource}.
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}

/**
 * Combined protection: Authentication + Organization Permission
 * Most common use case - wrap your protected pages with this
 * 
 * @example
 * export default function ManageMembersPage() {
 *   return (
 *     <ProtectedOrgPage resource="member" actions={["read", "list"]}>
 *       <MembersList />
 *     </ProtectedOrgPage>
 *   )
 * }
 */
export function ProtectedOrgPage({
  children,
  resource,
  actions,
  redirectTo = "/login",
}: ProtectedOrgRouteProps & { redirectTo?: string }) {
  return (
    <ProtectedRoute redirectTo={redirectTo}>
      <ProtectedOrgRoute resource={resource} actions={actions}>
        {children}
      </ProtectedOrgRoute>
    </ProtectedRoute>
  )
}

/**
 * Higher-Order Component for permission-based rendering
 * Wraps a component with permission checks
 * 
 * @example
 * const ProtectedComponent = withPermission(
 *   MyComponent,
 *   "member",
 *   ["create", "update"]
 * )
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  actions: string[]
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <ProtectedOrgRoute resource={resource} actions={actions}>
        <Component {...props} />
      </ProtectedOrgRoute>
    )
  }
}

/**
 * HOC for authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = "/login"
) {
  return function AuthWrappedComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

