/**
 * Shared Permissions Configuration (Client-Side)
 * 
 * IMPORTANT: This file MUST be kept in sync with the server-side permissions.ts
 * Uses enums and simplified CRUD operations
 */

import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

/**
 * Resource enums for type safety - matches backend exactly
 */
export enum Resource {
  USER = "user",
  SESSION = "session",
  CHURCH_MEMBER = "church_member",
  CHURCH_SERVICE = "church_service",
  MINISTER = "minister",
  ANALYTICS = "analytics",
  ROLE = "role",
}

/**
 * Action enums for type safety - matches backend exactly
 * Simplified to CRUD operations only
 */
export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

/**
 * Define all resources and their available permissions
 * Simplified to CRUD operations - matches backend exactly
 */
export const statement = {
  ...defaultStatements,

  // Member resource permissions - CRUD only
  [Resource.CHURCH_MEMBER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],

  // Church service resource permissions - CRUD only
  [Resource.CHURCH_SERVICE]: [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
  ],

  // Minister resource permissions - CRUD only
  [Resource.MINISTER]: [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
  ],

  // Analytics resource permissions - Read only for reports
  [Resource.ANALYTICS]: [Action.READ],

  // Role management permissions - CRUD operations
  [Resource.ROLE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
} as const

/**
 * Create the access control instance
 * This must match the server-side ac instance
 */
export const ac = createAccessControl(statement)

/**
 * Type for resource names
 */
export type ResourceName = `${Resource}`

/**
 * Type for action names
 */
export type ActionName = `${Action}`

/**
 * Legacy role names for backward compatibility
 * NOTE: With organization plugin, these are now dynamic and can be created at runtime
 */
export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  CHURCH_PASTOR: "churchPastor",
  ADMIN: "admin",
  MINISTER: "minister",
  VIEWER: "viewer",
} as const

/**
 * Type for role names
 */
export type RoleName = (typeof ROLES)[keyof typeof ROLES]

/**
 * Get role badge color based on role
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    superAdmin: "bg-red-600",
    churchPastor: "bg-purple-600",
    admin: "bg-blue-600",
    minister: "bg-green-600",
    viewer: "bg-gray-600",
    // Additional dynamic roles
    youth_minister: "bg-indigo-600",
    worship_leader: "bg-pink-600",
    finance_manager: "bg-yellow-600",
  }
  return colors[role] || "bg-gray-600"
}

/**
 * Get role display name in English
 */
export function getRoleDisplayName(role: string): string {
  const names: Record<string, string> = {
    superAdmin: "Super Admin",
    churchPastor: "Church Pastor",
    admin: "Admin",
    minister: "Minister",
    viewer: "Viewer",
    // Additional dynamic roles
    youth_minister: "Youth Minister",
    worship_leader: "Worship Leader",
    finance_manager: "Finance Manager",
    member: "Member",
  }
  return names[role] || role
}

/**
 * Get role display name in Amharic
 */
export function getRoleDisplayNameAmharic(role: string): string {
  const names: Record<string, string> = {
    superAdmin: "ሱፐር አድሚን",
    churchPastor: "የቤተ ክርስቲያን ፓስተር",
    admin: "አድሚን",
    minister: "ሚኒስተር",
    viewer: "ተመልካች",
    // Additional dynamic roles
    youth_minister: "የወጣቶች አገልጋይ",
    worship_leader: "የአምልኮ መሪ",
    finance_manager: "የፋይናንስ አስተዳዳሪ",
    member: "አባል",
  }
  return names[role] || role
}
