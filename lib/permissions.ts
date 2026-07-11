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
  CONFIG = "config",
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

  // Config resource permissions - System configuration
  [Resource.CONFIG]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],

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
  // Notion-style restrained tints: soft background + readable colored text
  const colors: Record<string, string> = {
    superAdmin: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    churchPastor: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    admin: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    minister: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    viewer: "bg-muted text-muted-foreground",
    // Additional dynamic roles
    youth_minister: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    worship_leader: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    finance_manager: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }
  return colors[role] || "bg-muted text-muted-foreground"
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
