import type { ChurchGroup, SubCommunity } from "@/lib/types"

export const SUB_COMMUNITY_SLUGS = ["jemmo", "bethel", "weyira", "alpha"] as const

export type SubCommunitySlug = (typeof SUB_COMMUNITY_SLUGS)[number]

export const AGE_GROUP_SLUGS = ["youth", "children"] as const

export type AgeGroupSlug = (typeof AGE_GROUP_SLUGS)[number]

export const AGE_GROUP_BY_SLUG: Record<
  AgeGroupSlug,
  { label: "Youth" | "Children" }
> = {
  youth: { label: "Youth" },
  children: { label: "Children" },
}

export const SUB_COMMUNITY_BY_SLUG: Record<
  SubCommunitySlug,
  { label: SubCommunity; churchGroup: ChurchGroup }
> = {
  jemmo: { label: "Jemmo", churchGroup: "jemmo" },
  bethel: { label: "Bethel", churchGroup: "bethel" },
  weyira: { label: "Weyira", churchGroup: "weyira" },
  alpha: { label: "Alpha", churchGroup: "alpha" },
}

export function isSubCommunitySlug(value: string): value is SubCommunitySlug {
  return (SUB_COMMUNITY_SLUGS as readonly string[]).includes(value)
}

export function isAgeGroupSlug(value: string): value is AgeGroupSlug {
  return (AGE_GROUP_SLUGS as readonly string[]).includes(value)
}

export function subCommunityHref(slug: SubCommunitySlug) {
  return `/members/community/${slug}`
}

export function ageGroupHref(slug: AgeGroupSlug) {
  return `/members/age/${slug}`
}

export function newMemberHref(slug?: SubCommunitySlug, age?: AgeGroupSlug) {
  const params = new URLSearchParams()
  if (slug) params.set("community", slug)
  if (age) params.set("age", age)
  const qs = params.toString()
  return qs ? `/members/new?${qs}` : "/members/new"
}
