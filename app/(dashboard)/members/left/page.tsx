"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, UserMinus, Users, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMembers } from "@/lib/members-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useMyNotedMemberIds } from "@/hooks/use-my-noted-member-ids"
import type { Member } from "@/lib/types"

const LEFT_STATUSES: Member["membershipStatus"][] = [
  "Inactive",
  "Removed",
  "Transferred Out",
  "Deceased",
]

const BATCH_SIZE = 40

function displayName(m: Member) {
  return (
    m.fullName ||
    [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") ||
    "—"
  )
}

export default function LeftMembersPage() {
  const { members, loading } = useMembers()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const router = useRouter()
  const en = locale !== "am"
  const { notedMemberIds } = useMyNotedMemberIds()

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const leftMembers = useMemo(() => {
    return members
      .filter((m) => LEFT_STATUSES.includes(m.membershipStatus))
      .filter((m) => {
        if (!search) return true
        const name = displayName(m).toLowerCase()
        const phone = (m.phone || "").toLowerCase()
        return name.includes(search) || phone.includes(search)
      })
      .sort((a, b) => {
        const da = a.statusChangeDate ? new Date(a.statusChangeDate).getTime() : 0
        const db = b.statusChangeDate ? new Date(b.statusChangeDate).getTime() : 0
        return db - da
      })
  }, [members, search])

  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [search])

  const visibleItems = leftMembers.slice(0, visibleCount)
  const hasMore = visibleCount < leftMembers.length

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, leftMembers.length))
        }
      },
      { rootMargin: "200px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, leftMembers.length])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {en ? "Left Members" : "የወጡ አባላት"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {en
              ? "Former members with their previous details and leave date"
              : "የቀድሞ አባላት ከዝርዝራቸው እና ከወጡበት ቀን ጋር"}
          </p>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {leftMembers.length} {en ? "left" : "ወጥተዋል"}
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t.navigation.searchPlaceholder}
          className="pl-10 h-9"
        />
      </div>

      <Card className="overflow-hidden">
        <Table className="w-full text-base">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                {en ? "No." : "ተ.ቁ"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold">
                {en ? "Name" : "ስም"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                {en ? "Phone" : "ስልክ"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                {en ? "Status" : "ሁኔታ"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                {en ? "Left on" : "የወጡበት ቀን"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold">
                {en ? "Reason" : "ምክንያት"}
              </TableHead>
              <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                {en ? "Community" : "ማህበረሰብ"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j} className="px-3">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visibleItems.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7}>
                  <div className="text-center py-14">
                    <UserMinus className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-1">
                      {en ? "No left members" : "የወጡ አባላት የሉም"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {en
                        ? "Members marked inactive, transferred, removed, or deceased appear here."
                        : "እንቅስቃሴ የሌላቸው፣ የተዛወሩ፣ የተወገዱ ወይም የሞቱ አባላት እዚህ ይታያሉ።"}
                    </p>
                    <Link href="/members">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Users className="w-4 h-4" />
                        {en ? "Back to members" : "ወደ አባላት ተመለስ"}
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleItems.map((member, index) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/members/${member.id}`)}
                >
                  <TableCell className="px-3 text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{displayName(member)}</span>
                      {notedMemberIds.has(member.id) && (
                        <span
                          title={en ? "You have a note" : "የእርስዎ ማስታወሻ አለ"}
                          className="inline-flex text-amber-600 dark:text-amber-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StickyNote className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground whitespace-nowrap">
                    {member.phone || "—"}
                  </TableCell>
                  <TableCell className="px-3 whitespace-nowrap">
                    <Badge variant="secondary">{member.membershipStatus}</Badge>
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground whitespace-nowrap">
                    {member.statusChangeDate
                      ? new Date(member.statusChangeDate).toLocaleDateString(
                          locale === "am" ? "am-ET" : undefined,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground max-w-[220px] truncate">
                    {member.leaveReason || "—"}
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground whitespace-nowrap">
                    {member.subCommunity || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div ref={loadMoreRef} />
      {!loading && leftMembers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {en
            ? `Showing ${visibleItems.length} of ${leftMembers.length}`
            : `${visibleItems.length} ከ ${leftMembers.length}`}
        </p>
      )}
    </div>
  )
}
