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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
  StickyNote,
  Table as TableIcon,
  Users,
  UsersRound,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { searchFamilies } from "@/lib/families-api"
import type { Family, FamilyMember } from "@/lib/types"
import { initial, memberInfo, roleLabel } from "@/components/families/family-labels"
import { useMyNotedFamilyIds } from "@/hooks/use-my-noted-family-ids"
import { SUB_COMMUNITY_SLUGS } from "@/lib/sub-communities"
import { subCommunityForRole } from "@/lib/role-utils"

type ViewMode = "table" | "card"
const VIEW_STORAGE_KEY = "families-view-mode-v2"

/** Prefer the household head for the row's contact line, else fall back to the first member. */
function primaryContact(members: FamilyMember[]) {
  const head =
    members.find((m) => m.role === "father") ||
    members.find((m) => m.role === "mother") ||
    members[0]
  return head ? memberInfo(head) : null
}

export default function FamiliesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { notedFamilyIds } = useMyNotedFamilyIds()
  const en = locale !== "am"
  const scopedCommunity = subCommunityForRole(user?.role)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [subCommunity, setSubCommunity] = useState<string>("all")
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState<ViewMode>("card")
  const limit = 12

  // Restore the user's last-picked view (card/box is the default for first-time visitors).
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === "table" || stored === "card") setView(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])

  // Debounce the search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const filter =
      scopedCommunity ||
      (subCommunity !== "all" ? subCommunity : undefined)
    searchFamilies(search, page, limit, filter)
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
  }, [search, page, subCommunity, scopedCommunity])

  const communityLabel = (slug: string) => {
    if (slug === "jemmo") return t.navigation.jemmo
    if (slug === "bethel") return t.navigation.bethel
    if (slug === "weyira") return t.navigation.weyira
    if (slug === "alpha") return t.navigation.alpha
    return slug
  }

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

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
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
          {!scopedCommunity && (
            <Select
              value={subCommunity}
              onValueChange={(value) => {
                setSubCommunity(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue
                  placeholder={en ? "Sub-community" : "ንዑስ ማህበረሰብ"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{en ? "All communities" : "ሁሉም"}</SelectItem>
                {SUB_COMMUNITY_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {communityLabel(slug)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(v) => v && setView(v as ViewMode)}
        >
          <ToggleGroupItem value="table" aria-label={locale === "am" ? "ሠንጠረዥ" : "Table view"}>
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label={locale === "am" ? "ካርድ" : "Card view"}>
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        view === "table" ? (
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        )
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
          {view === "table" ? (
            <Card className="overflow-hidden">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4 text-xs font-semibold">
                      {locale === "am" ? "ቤተሰብ" : "Family"}
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold">
                      {locale === "am" ? "ተጠሪ" : "Contact"}
                    </TableHead>
                    <TableHead className="w-[1%] px-4 text-xs font-semibold whitespace-nowrap">
                      {locale === "am" ? "አባላት" : "Members"}
                    </TableHead>
                    <TableHead className="w-[1%] px-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => {
                    const name =
                      family.name || (locale === "am" ? "ያልተሰየመ ቤተሰብ" : "Unnamed family")
                    const contact = primaryContact(family.members)
                    return (
                      <TableRow
                        key={family._id}
                        tabIndex={0}
                        className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                        onClick={() => router.push(`/families/${family._id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") router.push(`/families/${family._id}`)
                        }}
                      >
                        <TableCell className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                              <UsersRound className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="truncate font-medium text-foreground">{name}</span>
                            {notedFamilyIds.has(family._id) && (
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
                        <TableCell className="px-4 py-2.5">
                          {contact ? (
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={contact.memberPicture} alt={contact.fullName} />
                                <AvatarFallback className="text-xs">
                                  {initial(contact.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 truncate text-muted-foreground">
                                {contact.fullName || (locale === "am" ? "አባል" : "Member")}
                                {contact.phoneNumber ? ` · ${contact.phoneNumber}` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <Users className="h-3 w-3" />
                            {family.members.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 text-right">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {families.map((family) => {
                const name =
                  family.name ||
                  (locale === "am" ? "ያልተሰየመ ቤተሰብ" : "Unnamed family")
                const father = family.members.find((m) => m.role === "father")
                const mother = family.members.find((m) => m.role === "mother")
                const children = family.members.filter((m) => m.role === "child")
                const others = family.members.filter(
                  (m) => m.role !== "father" && m.role !== "mother" && m.role !== "child",
                )

                const PersonChip = ({ fm }: { fm: FamilyMember }) => {
                  const info = memberInfo(fm)
                  return (
                    <div className="flex max-w-full items-center gap-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={info.memberPicture} alt={info.fullName} />
                        <AvatarFallback className="text-xs">
                          {initial(info.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">
                        {info.fullName || (locale === "am" ? "አባል" : "Member")}
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                        {roleLabel(fm.role, locale)}
                      </Badge>
                    </div>
                  )
                }

                return (
                  <button
                    key={family._id}
                    type="button"
                    onClick={() => router.push(`/families/${family._id}`)}
                    className="group flex w-full flex-col rounded-lg border border-border bg-card px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
                        {notedFamilyIds.has(family._id) && (
                          <span
                            title={en ? "You have a note" : "የእርስዎ ማስታወሻ አለ"}
                            className="inline-flex shrink-0 text-amber-600 dark:text-amber-400"
                          >
                            <StickyNote className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {family.members.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
                      {/* Father — left */}
                      <div className="flex justify-start">
                        {father ? (
                          <PersonChip fm={father} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Mother — center */}
                      <div className="flex justify-start sm:justify-center">
                        {mother ? (
                          <PersonChip fm={mother} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Children — right / bottom */}
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        {children.map((fm, i) => (
                          <PersonChip key={memberInfo(fm).id || `c-${i}`} fm={fm} />
                        ))}
                        {others.map((fm, i) => (
                          <PersonChip key={memberInfo(fm).id || `o-${i}`} fm={fm} />
                        ))}
                        {children.length === 0 && others.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 border-t border-border pt-2 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {locale === "am" ? "ዝርዝር ይመልከቱ" : "View details"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

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
