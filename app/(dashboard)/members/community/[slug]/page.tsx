"use client"

import { notFound, useParams } from "next/navigation"
import { MembersListPage } from "@/components/members/members-list-page"
import { isSubCommunitySlug } from "@/lib/sub-communities"

export default function SubCommunityMembersPage() {
  const params = useParams()
  const slug = String(params.slug || "").trim().toLowerCase()

  if (!isSubCommunitySlug(slug)) {
    notFound()
  }

  return <MembersListPage lockedCommunity={slug} />
}
