/**
 * Server-Side Auth Guards
 * 
 * Use these in Server Components and Server Actions to protect routes
 * and check permissions on the server
 */

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { authClient } from "./auth-client"

/**
 * Get the current session on the server
 * Use in Server Components and Server Actions
 * 
 * @example
 * export default async function DashboardPage() {
 *   const session = await getServerSession()
 *   if (!session) redirect('/login')
 *   return <Dashboard user={session.user} />
 * }
 */
export async function getServerSession() {
  try {
    // Note: In server components, we need to pass headers
    const headersList = await headers()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/session`,
      {
        headers: {
          cookie: headersList.get("cookie") || "",
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.session || null
  } catch (error) {
    console.error("Failed to get server session:", error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * 
 * @example
 * export default async function ProtectedPage() {
 *   const session = await requireAuth()
 *   return <Content user={session.user} />
 * }
 */
export async function requireAuth() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

/**
 * Check if user has specific organization permission
 * 
 * @param organizationId - The organization ID to check
 * @param resource - The resource to check (e.g., "member")
 * @param actions - Array of actions to check (e.g., ["create", "update"])
 * @returns Promise<boolean>
 * 
 * @example
 * const hasPermission = await checkOrgPermission(
 *   orgId,
 *   "member",
 *   ["create"]
 * )
 * 
 * if (!hasPermission) {
 *   return <AccessDenied />
 * }
 */
export async function checkOrgPermission(
  organizationId: string,
  resource: string,
  actions: string[]
): Promise<boolean> {
  const session = await getServerSession()

  if (!session) {
    return false
  }

  try {
    const headersList = await headers()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/organization/has-permission`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: headersList.get("cookie") || "",
        },
        body: JSON.stringify({
          organizationId,
          userId: session.user.id,
          permission: {
            [resource]: actions,
          },
        }),
      }
    )

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.hasPermission || false
  } catch (error) {
    console.error("Permission check failed:", error)
    return false
  }
}

/**
 * Require specific organization permission - throws/redirects if not authorized
 * 
 * @example
 * export default async function CreateMemberPage({ params }: { params: { orgId: string } }) {
 *   await requireOrgPermission(params.orgId, "member", ["create"])
 *   return <CreateMemberForm />
 * }
 */
export async function requireOrgPermission(
  organizationId: string,
  resource: string,
  actions: string[]
) {
  const hasPermission = await checkOrgPermission(organizationId, resource, actions)

  if (!hasPermission) {
    redirect("/unauthorized")
  }

  return true
}

/**
 * Get active organization for current user
 */
export async function getActiveOrganization() {
  const session = await getServerSession()

  if (!session) {
    return null
  }

  try {
    const headersList = await headers()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/organization/get-active`,
      {
        headers: {
          cookie: headersList.get("cookie") || "",
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to get active organization:", error)
    return null
  }
}

