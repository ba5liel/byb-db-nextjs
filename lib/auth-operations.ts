/**
 * Authentication and Organization Operations
 * 
 * Centralized utility functions for common auth and organization operations
 * Provides type-safe wrappers around Better Auth client
 */

import { authClient } from "./auth-client"

// ============================================
// USER MANAGEMENT (Admin Plugin - System-Wide)
// ============================================

/**
 * Create a new user (Admin only)
 */
export async function createUser(data: {
  email: string
  password: string
  name: string
  role?: string
}) {
  return authClient.admin.createUser({
    email: data.email,
    password: data.password,
    name: data.name,
    data: {
      role: data.role || "member",
    },
  })
}

/**
 * List all users in the system (Admin only)
 */
export async function listAllUsers(params?: {
  limit?: number
  offset?: number
  searchValue?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}) {
  return authClient.admin.listUsers({
    query: {
      limit: params?.limit,
      offset: params?.offset,
      searchValue: params?.searchValue,
      sortBy: params?.sortBy,
      sortDirection: params?.sortDirection,
    },
  })
}

/**
 * Ban a user from the system (Admin only)
 */
export async function banUser(userId: string, reason?: string) {
  return authClient.admin.banUser({
    userId,
    banReason: reason,
  })
}

/**
 * Unban a user (Admin only)
 */
export async function unbanUser(userId: string) {
  return authClient.admin.unbanUser({
    userId,
  })
}

/**
 * Set a user's system-wide role (Admin only)
 */
export async function setUserRole(userId: string, role: string) {
  return authClient.admin.setRole({
    userId,
    role,
  })
}

/**
 * Impersonate a user (Super Admin only)
 */
export async function impersonateUser(userId: string) {
  return authClient.admin.impersonate({
    userId,
  })
}

/**
 * Revoke a user's session (Admin only)
 */
export async function revokeUserSession(sessionId: string) {
  return authClient.admin.revokeSession({
    sessionId,
  })
}

// ============================================
// ORGANIZATION MANAGEMENT
// ============================================

/**
 * Create a new organization (Super Admin only)
 */
export async function createOrganization(data: {
  name: string
  slug: string
  logo?: string
  metadata?: Record<string, any>
}) {
  return authClient.organization.create({
    name: data.name,
    slug: data.slug,
    logo: data.logo,
    metadata: data.metadata,
  })
}

/**
 * Get full organization details
 */
export async function getOrganization(organizationId: string) {
  return authClient.organization.getFullOrganization({
    organizationId,
  })
}

/**
 * List all organizations for current user
 */
export async function listUserOrganizations() {
  return authClient.organization.listUserOrganizations()
}

/**
 * Update organization details
 */
export async function updateOrganization(
  organizationId: string,
  data: {
    name?: string
    slug?: string
    logo?: string
    metadata?: Record<string, any>
  }
) {
  return authClient.organization.updateOrganization({
    organizationId,
    ...data,
  })
}

/**
 * Delete an organization (Super Admin only)
 */
export async function deleteOrganization(organizationId: string) {
  return authClient.organization.deleteOrganization({
    organizationId,
  })
}

/**
 * Get active organization
 */
export async function getActiveOrganization() {
  return authClient.organization.getActiveOrganization()
}

/**
 * Set active organization for current user
 */
export async function setActiveOrganization(organizationId: string) {
  return authClient.organization.setActive({
    organizationId,
  })
}

// ============================================
// MEMBER MANAGEMENT (Within Organization)
// ============================================

/**
 * Invite a member to an organization
 */
export async function inviteMemberToOrg(
  organizationId: string,
  email: string,
  role: string
) {
  return authClient.organization.inviteMember({
    organizationId,
    email,
    role,
  })
}

/**
 * Accept an organization invitation
 */
export async function acceptInvitation(invitationId: string) {
  return authClient.organization.acceptInvitation({
    invitationId,
  })
}

/**
 * Reject an organization invitation
 */
export async function rejectInvitation(invitationId: string) {
  return authClient.organization.rejectInvitation({
    invitationId,
  })
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string) {
  return authClient.organization.cancelInvitation({
    invitationId,
  })
}

/**
 * List all members in an organization
 */
export async function listOrgMembers(organizationId: string) {
  return authClient.organization.listMembers({
    organizationId,
  })
}

/**
 * Update a member's role in the organization
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  newRole: string
) {
  return authClient.organization.updateMemberRole({
    organizationId,
    userId,
    role: newRole,
  })
}

/**
 * Remove a member from the organization
 */
export async function removeMemberFromOrg(
  organizationId: string,
  userId: string
) {
  return authClient.organization.removeMember({
    organizationId,
    userId,
  })
}

/**
 * Leave an organization
 */
export async function leaveOrganization(organizationId: string) {
  return authClient.organization.leaveOrganization({
    organizationId,
  })
}

// ============================================
// DYNAMIC ROLE MANAGEMENT (Organization-Specific)
// ============================================

/**
 * Create a custom role in an organization
 */
export async function createCustomRole(
  organizationId: string,
  roleName: string,
  permissions: Record<string, string[]>,
  description?: string
) {
  return authClient.organization.createRole({
    organizationId,
    name: roleName,
    description: description || "",
    permissions,
  })
}

/**
 * List all roles in an organization
 */
export async function listOrgRoles(organizationId: string) {
  return authClient.organization.listRoles({
    organizationId,
  })
}

/**
 * Update a role's permissions
 */
export async function updateRole(
  organizationId: string,
  roleId: string,
  permissions: Record<string, string[]>,
  description?: string
) {
  return authClient.organization.updateRole({
    organizationId,
    roleId,
    permissions,
    description,
  })
}

/**
 * Delete a role from an organization
 */
export async function deleteRole(organizationId: string, roleId: string) {
  return authClient.organization.deleteRole({
    organizationId,
    roleId,
  })
}

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if current user has specific permissions in an organization
 */
export async function checkPermission(
  organizationId: string,
  resource: string,
  actions: string[]
) {
  const { data } = await authClient.organization.hasPermission({
    organizationId,
    permission: {
      [resource]: actions,
    },
  })

  return data?.hasPermission || false
}

/**
 * Check multiple permissions at once
 */
export async function checkMultiplePermissions(
  organizationId: string,
  permissions: Record<string, string[]>
) {
  const { data } = await authClient.organization.hasPermission({
    organizationId,
    permission: permissions,
  })

  return data?.hasPermission || false
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current session
 */
export async function getCurrentSession() {
  return authClient.getSession()
}

/**
 * Sign out current user
 */
export async function signOut() {
  return authClient.signOut()
}

/**
 * List all active sessions for current user
 */
export async function listSessions() {
  return authClient.listSessions()
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string) {
  return authClient.revokeSession({
    id: sessionId,
  })
}

// ============================================
// INVITATION MANAGEMENT
// ============================================

/**
 * List pending invitations for an organization
 */
export async function listPendingInvitations(organizationId: string) {
  return authClient.organization.getInvitations({
    organizationId,
  })
}

/**
 * Get invitation by ID
 */
export async function getInvitation(invitationId: string) {
  return authClient.organization.getInvitation({
    invitationId,
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(
  organizationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await authClient.organization.getFullOrganization({
      organizationId,
    })

    return data?.createdBy === userId || false
  } catch {
    return false
  }
}

/**
 * Get user's role in an organization
 */
export async function getUserRoleInOrg(
  organizationId: string,
  userId: string
): Promise<string | null> {
  try {
    const { data } = await authClient.organization.getFullOrganization({
      organizationId,
    })

    const member = data?.members?.find((m: any) => m.userId === userId)
    return member?.role || null
  } catch {
    return null
  }
}

/**
 * Check if user is member of an organization
 */
export async function isOrganizationMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRoleInOrg(organizationId, userId)
  return role !== null
}

