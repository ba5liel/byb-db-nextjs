/**
 * Roles Service - Better Auth Integration
 * Uses Better Auth client directly instead of backend API calls
 */

import { authClient } from '@/lib/auth-client'
import type {
  RolesListResponse,
  PermissionsResponse,
  CurrentUserRole,
  RoleConstantsResponse,
} from '../types'

/**
 * Get all roles from Better Auth organization
 */
export async function getRoles(): Promise<RolesListResponse> {
  try {
    const response = await authClient.organization.listRoles()
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch roles')
    }

    // Better Auth returns roles with structure: { id, organizationId, role, permission, createdAt, updatedAt? }
    const betterAuthRoles = response.data || []
    
    const transformedRoles = betterAuthRoles.map((betterAuthRole) => ({
      id: betterAuthRole.id,
      name: betterAuthRole.role, // Better Auth uses 'role' field for the role name
      nameAmharic: betterAuthRole.role, // Better Auth doesn't have Amharic names
      description: `Role: ${betterAuthRole.role}`,
      descriptionAmharic: '',
      permissions: {
        statements: betterAuthRole.permission || {}, // Better Auth uses 'permission' field
      },
      isSystemRole: ['owner', 'member', 'superAdmin', 'churchPastor', 'admin', 'minister', 'viewer'].includes(betterAuthRole.role),
      createdAt: betterAuthRole.createdAt?.toISOString() || new Date().toISOString(),
    }))
    
    return {
      roles: transformedRoles,
      totalRoles: transformedRoles.length,
    }
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw error
  }
}

/**
 * Get all available permissions/resources from Better Auth
 */
export async function getPermissions(): Promise<PermissionsResponse> {
  try {
    // Better Auth doesn't have a direct "list all permissions" endpoint
    // So we'll return the permissions structure we know from our implementation
    const response = await authClient.organization.listRoles()
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch permissions')
    }

    // Extract unique resources from all roles
    const betterAuthRoles = response.data || []
    const allResources: Record<string, string[]> = {}

    betterAuthRoles.forEach((betterAuthRole) => {
      const permissions = betterAuthRole.permission
      if (permissions) {
        Object.entries(permissions).forEach(([resource, actions]) => {
          if (!allResources[resource]) {
            allResources[resource] = []
          }
          const actionArray = actions as string[]
          actionArray.forEach((action: string) => {
            if (!allResources[resource].includes(action)) {
              allResources[resource].push(action)
            }
          })
        })
      }
    })

    return {
      resources: allResources,
      description: 'All available permissions and resources in the system',
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    throw error
  }
}

/**
 * Get current user's role and permissions from Better Auth
 */
export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  try {
    // Get session to get user info
    const sessionResponse = await authClient.getSession()
    
    if (sessionResponse.error || !sessionResponse.data) {
      throw new Error('Not authenticated')
    }

    // Get active member role
    const memberRoleResponse = await authClient.organization.getActiveMemberRole()
    
    if (memberRoleResponse.error || !memberRoleResponse.data) {
      throw new Error('Failed to fetch user role')
    }

    const user = sessionResponse.data.user
    const role = memberRoleResponse.data.role || 'member'

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: role,
      roleMetadata: {
        name: role,
        nameAmharic: role, // Better Auth doesn't have Amharic names by default
        description: `Role: ${role}`,
        descriptionAmharic: `ሚና: ${role}`,
      },
      permissions: {}, // Permissions are in session via auth-context
    }
  } catch (error) {
    console.error('Error fetching current user role:', error)
    throw error
  }
}

/**
 * Get role constants (for frontend use)
 * Returns predefined roles and their metadata
 */
export async function getRoleConstants(): Promise<RoleConstantsResponse> {
  // These are our predefined roles
  return {
    roleNames: {
      SUPER_ADMIN: 'superAdmin',
      CHURCH_PASTOR: 'churchPastor',
      ADMIN: 'admin',
      MINISTER: 'minister',
      VIEWER: 'viewer',
    },
    metadata: {
      superAdmin: {
        name: 'Super Admin',
        nameAmharic: 'ከፍተኛ አስተዳዳሪ',
        description: 'Full system access with all permissions',
        descriptionAmharic: 'ሙሉ የስርዓት መዳረሻ ከሁሉም ፈቃዶች ጋር',
      },
      churchPastor: {
        name: 'Church Pastor',
        nameAmharic: 'የቤተክርስቲያን ፓስተር',
        description: 'Church administrator with full church management access',
        descriptionAmharic: 'ሙሉ የቤተክርስቲያን አስተዳደር መዳረሻ ያለው የቤተክርስቲያን አስተዳዳሪ',
      },
      admin: {
        name: 'Admin',
        nameAmharic: 'አስተዳዳሪ',
        description: 'Administrative access to church operations',
        descriptionAmharic: 'የቤተክርስቲያን ስራዎች አስተዳደር መዳረሻ',
      },
      minister: {
        name: 'Minister',
        nameAmharic: 'አገልጋይ',
        description: 'Minister with limited church management access',
        descriptionAmharic: 'የተወሰነ የቤተክርስቲያን አስተዳደር መዳረሻ ያለው አገልጋይ',
      },
      viewer: {
        name: 'Viewer',
        nameAmharic: 'ተመልካች',
        description: 'Read-only access to church information',
        descriptionAmharic: 'የቤተክርስቲያን መረጃ ለማንበብ ብቻ መዳረሻ',
      },
    },
  }
}

