"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Network, Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import {
  isChildrenAdmin,
  isSuperAdmin,
  subCommunityForRole,
} from "@/lib/role-utils"
import {
  getCellGroups,
  type CellGroup,
  type SubCommunityId,
} from "@/lib/cell-groups-api"

const COMMUNITY_LABELS: Record<SubCommunityId, { en: string; am: string }> = {
  jemmo: { en: "Jemmo", am: "ጀሞ" },
  bethel: { en: "Bethel", am: "ቤቴል" },
  weyira: { en: "Weyira", am: "ወይራ" },
  alpha: { en: "Alpha", am: "አልፋ" },
}

function memberCount(group: CellGroup) {
  return Array.isArray(group.memberIds) ? group.memberIds.length : 0
}

export default function CellGroupsPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const en = locale !== "am"

  const scoped = subCommunityForRole(user?.role) as SubCommunityId | undefined
  const canCreate = isSuperAdmin(user?.role)
  const blocked = isChildrenAdmin(user?.role)

  const [groups, setGroups] = useState<CellGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (blocked) {
      router.replace("/")
      return
    }
    let active = true
    setLoading(true)
    getCellGroups(scoped)
      .then((data) => {
        if (active) setGroups(data)
      })
      .catch((err) => {
        toast({
          title: en ? "Could not load cell groups" : "ሴል ግሩፖችን መጫን አልተቻለም",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scoped, blocked, router, toast, en])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.subCommunity.toLowerCase().includes(q),
    )
  }, [groups, search])

  if (blocked) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {en ? "Cell Groups" : "ሴል ግሩፖች"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scoped
              ? en
                ? `Cell groups in ${COMMUNITY_LABELS[scoped].en}`
                : `የ${COMMUNITY_LABELS[scoped].am} ሴል ግሩፖች`
              : en
                ? "Manage small groups by sub-community"
                : "በንዑስ ማህበረሰብ የተከፋፈሉ ሴል ግሩፖች"}
          </p>
        </div>
        {canCreate && (
          <Link href="/cell-groups/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {en ? "Create cell group" : "ሴል ግሩፕ ፍጠር"}
            </Button>
          </Link>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={en ? "Search cell groups…" : "ሴል ግሩፖችን ፈልግ…"}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Network className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">
              {en ? "No cell groups yet" : "እስካሁን ሴል ግሩፕ የለም"}
            </p>
            {canCreate && (
              <Link href="/cell-groups/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {en ? "Create the first one" : "የመጀመሪያውን ፍጠር"}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((group) => (
            <button
              key={group._id}
              type="button"
              onClick={() => router.push(`/cell-groups/${group._id}`)}
              className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {en
                    ? COMMUNITY_LABELS[group.subCommunity]?.en || group.subCommunity
                    : COMMUNITY_LABELS[group.subCommunity]?.am || group.subCommunity}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {memberCount(group)} {en ? "members" : "አባላት"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
