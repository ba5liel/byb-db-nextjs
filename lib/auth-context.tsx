"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { authClient } from "./auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Resource, Action } from "./permissions"
import { normalizeRoleName } from "./role-utils"

// Type definitions
type User = {
  id: string
  email: string
  name: string
  role?: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  image?: string | null
}

type Session = {
  id: string
  userId: string
  activeOrganizationId?: string | null
  permissions?: Record<string, string[]> // Permissions added to session
  expiresAt: Date
  token: string
}

type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  updatedAt?: Date
}

interface AuthContextType {
  user: User | null
  session: Session | null
  activeOrganization: Organization | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hasPermission: (resource: Resource, action: Action) => boolean
  hasAnyPermission: (resource: Resource, actions: Action[]) => boolean
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to get predefined role permissions
const PREDEFINED_ROLES: Record<string, Record<string, string[]>> = {
  owner: {
    organization: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete", "invite", "update_role"],
    invitation: ["create", "read", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
    [Resource.CONFIG]: ["create", "read", "update", "delete"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.CHURCH_SERVICE]: ["create", "read", "update", "delete"],
    [Resource.MINISTER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
    [Resource.ROLE]: ["create", "read", "update", "delete"],
    [Resource.USER]: ["create", "read", "update", "delete", "list"],
    [Resource.SESSION]: ["create", "read", "update", "delete"],
  },
  churchPastor: {
    organization: ["read", "update"],
    member: ["create", "read", "update", "delete", "invite", "update_role"],
    invitation: ["create", "read", "delete"],
    ac: ["read"],
    [Resource.CONFIG]: ["read", "update"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.CHURCH_SERVICE]: ["create", "read", "update", "delete"],
    [Resource.MINISTER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
    [Resource.ROLE]: ["read", "update"],
  },
  admin: {
    organization: ["read", "update"],
    member: ["read", "invite", "update_role"],
    [Resource.CONFIG]: ["read"],
    [Resource.CHURCH_MEMBER]: ["read", "update"],
    [Resource.CHURCH_SERVICE]: ["create", "read", "update", "delete"],
    [Resource.MINISTER]: ["create", "read", "update"],
    [Resource.ANALYTICS]: ["read"],
    [Resource.ROLE]: ["read"],
  },
  minister: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update"],
    [Resource.CHURCH_SERVICE]: ["create", "read", "update"],
    [Resource.MINISTER]: ["read"],
    [Resource.ANALYTICS]: ["read"],
    [Resource.ROLE]: ["read"],
  },
  member: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["read"],
    [Resource.CHURCH_SERVICE]: ["read"],
    [Resource.MINISTER]: ["read"],
    [Resource.ANALYTICS]: ["read"],
  },
  bethelAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
  jemmoAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
  youthAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
  childrenAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
  weyiraAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
  alphaAdmin: {
    organization: ["read"],
    member: ["read"],
    [Resource.CHURCH_MEMBER]: ["create", "read", "update", "delete"],
    [Resource.ANALYTICS]: ["read"],
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  /**
   * Fetch permissions from the user's active member role
   * This function retrieves permissions and adds them to the session
   */
  const fetchPermissions = useCallback(async (organizationId: string | null | undefined) => {
    if (!organizationId) return { role: null as string | null, permissions: {} as Record<string, string[]> }

    try {
      const memberRoleResponse = await authClient.organization.getActiveMemberRole()

      if (!memberRoleResponse.data?.role) {
        return { role: null, permissions: {} }
      }

      const roleName =
        normalizeRoleName(memberRoleResponse.data.role) ??
        memberRoleResponse.data.role

      if (PREDEFINED_ROLES[roleName]) {
        return { role: roleName, permissions: PREDEFINED_ROLES[roleName] }
      }

      const roleResponse = await authClient.organization.getRole({
        query: {
          roleName: roleName,
          organizationId: organizationId,
        },
      })

      if (roleResponse.data?.permission) {
        return {
          role: roleName,
          permissions: roleResponse.data.permission as Record<string, string[]>,
        }
      }

      return { role: roleName, permissions: {} }
    } catch (error) {
      console.error("Error fetching permissions:", error)
      return { role: null, permissions: {} }
    }
  }, [])

  /**
   * Check session and load user data with permissions
   */
  const checkSession = useCallback(async () => {
    try {
      setLoading(true)

      const sessionResponse = await authClient.getSession()

      if (sessionResponse.data) {
        const userData = sessionResponse.data.user
        const sessionData = sessionResponse.data.session
        const activeOrgId = sessionData.activeOrganizationId || null

        // Prefer org role for UI/RBAC; keep admin-plugin superAdmin as-is
        const adminPluginRole = normalizeRoleName(userData.role) ?? userData.role
        const { role: orgRole, permissions } = await fetchPermissions(activeOrgId)
        const effectiveRole =
          adminPluginRole === "superAdmin"
            ? "superAdmin"
            : orgRole || adminPluginRole || "member"

        setUser({
          ...userData,
          role: effectiveRole,
        })

        setSession({
          ...sessionData,
          activeOrganizationId: activeOrgId,
          permissions,
        })

        if (activeOrgId) {
          try {
            const orgResponse = await authClient.organization.getFullOrganization({
              query: {
                organizationId: activeOrgId,
              },
            })

            if (orgResponse.data) {
              setActiveOrganization(orgResponse.data as Organization)
            }
          } catch (error) {
            console.error("Error fetching organization:", error)
          }
        }
      } else {
        setUser(null)
        setSession(null)
        setActiveOrganization(null)
      }
    } catch (error) {
      console.error("Session check failed:", error)
      setUser(null)
      setSession(null)
      setActiveOrganization(null)
    } finally {
      setLoading(false)
    }
  }, [fetchPermissions])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)

      const response = await authClient.signIn.email({
        email,
        password,
      })

      if (response.error) {
        throw new Error(response.error.message || "Login failed")
      }

      if (response.data) {
        await checkSession() // Refresh session with permissions
        toast.success("Login successful!")
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const response = await authClient.signUp.email({ email, password, name })

      if (response.error) {
        throw new Error(response.error.message || "Registration failed")
      }

      if (response.data) {
        // User is automatically added to default organization on backend
        await checkSession() // Refresh session with permissions
        toast.success("Registration successful!")
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authClient.signOut()
      setUser(null)
      setSession(null)
      setActiveOrganization(null)
      router.push("/login")
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  /**
   * Refresh session and reload permissions
   */
  const refreshSession = async () => {
    try {
      await checkSession()
    } catch (error) {
      console.error("Failed to refresh session:", error)
    }
  }

  /**
   * Check if user has a specific permission
   * Uses permissions from session (synchronous check)
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    // superAdmin has full access (mirrors the backend PermissionsGuard bypass)
    if (user?.role === "superAdmin") return true
    if (!session?.permissions) return false

    const resourcePermissions = session.permissions[resource]
    if (!resourcePermissions) return false

    return resourcePermissions.includes(action)
  }

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (resource: Resource, actions: Action[]): boolean => {
    if (user?.role === "superAdmin") return true
    if (!session?.permissions) return false
    const resourcePermissions = session.permissions[resource] || []
    return actions.some((action) => resourcePermissions.includes(action))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        activeOrganization,
        loading,
        login,
        register,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshSession,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
