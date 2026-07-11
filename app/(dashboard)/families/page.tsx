"use client"

/**
 * Families list page.
 * Debounced search across family and member names, paginated card list,
 * each row links to the family detail page.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Users, UsersRound } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { searchFamilies } from "@/lib/families-api"
import type { Family } from "@/lib/types"
import { initial, memberInfo, roleLabel } from "@/components/families/family-labels"

export default function FamiliesPage() {
  const router = useRouter()
  const { locale } = useLanguage()

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    searchFamilies(search, page, limit)
      .then((res) => {
        if (!active) return
        setFamilies(res.data)
        setTotalPages(res.totalPages || 1)
        setTotal(res.total || 0)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load families")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, page])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {locale === "am" ? "ቤተሰቦች" : "Families"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {locale === "am"
              ? "የተመዘገቡ ቤተሰቦችን ይመልከቱ እና ያስተዳድሩ"
              : "Browse and manage registered households"}
          </p>
        </div>
        <Link href="/families/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "am" ? "ቤተሰብ ይመዝግቡ" : "Register Household"}
          </Button>
        </Link>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={
            locale === "am" ? "በቤተሰብ ወይም በአባል ስም ይፈልጉ..." : "Search by family or member name..."
          }
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UsersRound className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {locale === "am" ? "ምንም ቤተሰብ አልተገኘም" : "No families yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === "am"
                  ? "አዲስ ቤተሰብ በመመዝገብ ይጀምሩ።"
                  : "Get started by registering a new household."}
              </p>
            </div>
            <Link href="/families/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {locale === "am" ? "ቤተሰብ ይመዝግቡ" : "Register Household"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => {
              const name =
                family.name ||
                (locale === "am" ? "ያልተሰየመ ቤተሰብ" : "Unnamed family")
              return (
                <button
                  key={family._id}
                  type="button"
                  onClick={() => router.push(`/families/${family._id}`)}
                  className="flex flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-foreground">{name}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {family.members.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {family.members.slice(0, 4).map((fm, i) => {
                      const info = memberInfo(fm)
                      return (
                        <div key={info.id || i} className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={info.memberPicture} alt={info.fullName} />
                            <AvatarFallback className="text-xs">
                              {initial(info.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {info.fullName || (locale === "am" ? "አባል" : "Member")}
                          </span>
                          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                            {roleLabel(fm.role, locale)}
                          </Badge>
                        </div>
                      )
                    })}
                    {family.members.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        {locale === "am"
                          ? `+${family.members.length - 4} ተጨማሪ`
                          : `+${family.members.length - 4} more`}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {locale === "am"
                ? `${total} ቤተሰቦች በአጠቃላይ`
                : `${total} families total`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {locale === "am" ? "ቀዳሚ" : "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {locale === "am" ? `ገጽ ${page} ከ ${totalPages}` : `Page ${page} of ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {locale === "am" ? "ቀጣይ" : "Next"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
