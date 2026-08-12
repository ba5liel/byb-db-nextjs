"use client"

import { notFound, useParams } from "next/navigation"
import { MembersListPage } from "@/components/members/members-list-page"
import { isAgeGroupSlug } from "@/lib/sub-communities"

export default function AgeGroupMembersPage() {
  const params = useParams()
  const slug = String(params.slug || "").trim().toLowerCase()

  if (!isAgeGroupSlug(slug)) {
    notFound()
  }

  return <MembersListPage lockedAgeGroup={slug} />
}
