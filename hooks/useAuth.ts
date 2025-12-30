/**
 * Enhanced Authentication Hooks
 * 
 * Provides session management and organization-aware permission checking
 * Uses Better Auth's organization plugin for multi-tenant support
 */

"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"

/**
 * Main authentication hook
 * Provides session data, user info, and active organization
 */
export function useAuth() {
  const { data: session, isPending: loading } = authClient.useSession()
  const [activeOrg, setActiveOrg] = useState<any>(null)
  const [orgLoading, setOrgLoading] = useState(true)

  useEffect(() => {
    // Get active organization if session exists
    const getActiveOrg = async () => {
      if (session?.user) {
        try {
          const { data } = await authClient.organization.getActiveOrganization()
          setActiveOrg(data)
        } catch (error) {
          console.error("Failed to get active organization:", error)
        }
      }
      setOrgLoading(false)
    }

    getActiveOrg()
  }, [session])

  return {
    session,
    user: session?.user || null,
    loading: loading || orgLoading,
    isAuthenticated: !!session,
    activeOrg,
    
    // Actions
    signOut: async () => {
      await authClient.signOut()
    },
    
    setActiveOrganization: async (organizationId: string) => {
      const { data, error } = await authClient.organization.setActive({
        organizationId,
      })
      
      if (!error && data) {
        setActiveOrg(data)
      }
      
      return { data, error }
    },
  }
}

/**
 * Hook to check organization-specific permissions
 * 
 * @param resource - The resource to check (e.g., "member", "worship")
 * @param actions - Array of actions to check (e.g., ["create", "update"])
 * @returns Object with hasPermission boolean and loading state
 * 
 * @example
 * const { hasPermission, loading } = useOrgPermission("member", ["create", "update"])
 * 
 * if (loading) return <Spinner />
 * if (!hasPermission) return <AccessDenied />
 * return <CreateMemberForm />
 */
export function useOrgPermission(resource: string, actions: string[]) {
  const { activeOrg, loading: authLoading } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPermission = async () => {
      if (!activeOrg || authLoading) {
        setLoading(authLoading)
        return
      }

      try {
        const { data } = await authClient.organization.hasPermission({
          organizationId: activeOrg.id,
          permission: {
            [resource]: actions,
          },
        })
        
        setHasPermission(data?.hasPermission || false)
      } catch (error) {
        console.error("Permission check failed:", error)
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [activeOrg, resource, actions, authLoading])

  return { hasPermission, loading }
}

/**
 * Hook to get all organizations the user is a member of
 */
export function useUserOrganizations() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data } = await authClient.organization.listUserOrganizations()
        setOrganizations(data || [])
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [user])

  return { organizations, loading }
}

/**
 * Hook to get current user's role in the active organization
 */
export function useCurrentOrgRole() {
  const { activeOrg, loading: authLoading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      if (!activeOrg || authLoading) {
        setLoading(authLoading)
        return
      }

      try {
        const { data } = await authClient.organization.getFullOrganization({
          organizationId: activeOrg.id,
        })
        
        // Get current user's role from members list
        const currentMember = data?.members?.find(
          (m: any) => m.userId === activeOrg.userId
        )
        
        setRole(currentMember?.role || null)
      } catch (error) {
        console.error("Failed to fetch user role:", error)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [activeOrg, authLoading])

  return { role, loading }
}

