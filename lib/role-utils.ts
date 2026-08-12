/**
 * Canonical role names — keep in sync with backend role-utils.ts
 */

export const CANONICAL_ROLES = [
  "superAdmin",
  "owner",
  "churchPastor",
  "admin",
  "minister",
  "member",
  "bethelAdmin",
  "jemmoAdmin",
  "youthAdmin",
  "childrenAdmin",
  "weyiraAdmin",
  "alphaAdmin",
] as const

export type CanonicalRole = (typeof CANONICAL_ROLES)[number]

const ROLE_BY_LOWER: Record<string, CanonicalRole> = Object.fromEntries(
  CANONICAL_ROLES.map((r) => [r.toLowerCase(), r]),
) as Record<string, CanonicalRole>

export function normalizeRoleName(role?: string | null): string | undefined {
  if (!role) return undefined
  return ROLE_BY_LOWER[role.toLowerCase()] ?? role
}

export function subCommunityForRole(role?: string | null): string | undefined {
  const r = normalizeRoleName(role)
  switch (r) {
    case "bethelAdmin":
      return "bethel"
    case "jemmoAdmin":
      return "jemmo"
    case "weyiraAdmin":
      return "weyira"
    case "alphaAdmin":
      return "alpha"
    default:
      return undefined
  }
}

export function isScopedCommunityAdmin(role?: string | null): boolean {
  return subCommunityForRole(role) !== undefined
}

/** UI title-case age group for demographic admins. */
export function ageGroupForRole(
  role?: string | null,
): "Youth" | "Children" | undefined {
  const r = normalizeRoleName(role)
  if (r === "youthAdmin") return "Youth"
  if (r === "childrenAdmin") return "Children"
  return undefined
}

/** Backend lowercase age group key. */
export function ageGroupKeyForRole(role?: string | null): string | undefined {
  const r = normalizeRoleName(role)
  if (r === "youthAdmin") return "youth"
  if (r === "childrenAdmin") return "children"
  return undefined
}

export function isAgeScopedAdmin(role?: string | null): boolean {
  return ageGroupForRole(role) !== undefined
}

export function isYouthAdmin(role?: string | null): boolean {
  return normalizeRoleName(role) === "youthAdmin"
}

export function isChildrenAdmin(role?: string | null): boolean {
  return normalizeRoleName(role) === "childrenAdmin"
}

export function isSuperAdmin(role?: string | null): boolean {
  const r = normalizeRoleName(role)
  return r === "superAdmin" || r === "owner"
}
