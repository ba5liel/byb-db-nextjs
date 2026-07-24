import type { ChurchGroup, SubCommunity } from "@/lib/types"

export const SUB_COMMUNITY_SLUGS = ["jemmo", "bethel", "weyira", "alpha"] as const

export type SubCommunitySlug = (typeof SUB_COMMUNITY_SLUGS)[number]

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

export function subCommunityHref(slug: SubCommunitySlug) {
  return `/members/community/${slug}`
}

export function newMemberHref(slug?: SubCommunitySlug) {
  return slug ? `/members/new?community=${slug}` : "/members/new"
}
