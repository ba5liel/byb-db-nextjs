"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Users,
  X,
  AlertCircle,
  BarChart3,
  MoreHorizontal,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMembers } from "@/lib/members-context"
import { getSefers } from "@/lib/sefers-api"
import { searchFamilies } from "@/lib/families-api"
import type { Member, Sefer, SubCommunity } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"
import {
  newMemberHref,
  SUB_COMMUNITY_BY_SLUG,
  type SubCommunitySlug,
} from "@/lib/sub-communities"

const BATCH_SIZE = 30

const CHURCH_GROUPS: Member["subCommunity"][] = ["Jemmo", "Bethel", "Weyira", "Alpha"]
const AGE_GROUPS: NonNullable<Member["ageGroup"]>[] = [
  "Children",
  "Teenagers",
  "Youth",
  "Adults",
  "Seniors",
]

/** Family lookup entry keyed by member id. */
interface FamilyRef {
  familyId: string
  familyName: string
}

export function MembersListPage({
  lockedCommunity,
}: {
  lockedCommunity?: SubCommunitySlug
} = {}) {
  const lockedSubCommunity: SubCommunity | undefined = lockedCommunity
    ? SUB_COMMUNITY_BY_SLUG[lockedCommunity].label
    : undefined
  const lockedChurchGroup = lockedCommunity
    ? SUB_COMMUNITY_BY_SLUG[lockedCommunity].churchGroup
    : undefined

  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const router = useRouter()
  const { hasPermission } = useAuth()
  const { members, loading, error, deleteMember } = useMembers()

  // Search (debounced) + filters
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [genderFilter, setGenderFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [seferFilter, setSeferFilter] = useState("all")
  const [ageGroupFilter, setAgeGroupFilter] = useState("all")

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Sefer options + member -> family map (fetched once)
  const [sefers, setSefers] = useState<Sefer[]>([])
  const [familyByMember, setFamilyByMember] = useState<Record<string, FamilyRef>>({})

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const availableSefers = useMemo(() => {
    if (!lockedChurchGroup) return sefers
    return sefers.filter((s) => s.churchGroup === lockedChurchGroup)
  }, [sefers, lockedChurchGroup])

  // Debounce the search input (300ms).
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  // Load sefer options + build the family lookup map once.
  useEffect(() => {
    getSefers()
      .then(setSefers)
      .catch(() => setSefers([]))

    searchFamilies("", 1, 500)
      .then((res) => {
        const map: Record<string, FamilyRef> = {}
        for (const family of res.data) {
          const familyName = family.name || (locale === "am" ? "ቤተሰብ" : "Family")
          for (const fm of family.members) {
            const id = typeof fm.memberId === "object" ? fm.memberId._id : fm.memberId
            if (id) map[id] = { familyId: family._id, familyName }
          }
        }
        setFamilyByMember(map)
      })
      .catch(() => setFamilyByMember({}))
    // locale only affects the fallback label; safe to ignore for refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasActiveFilters =
    statusFilter !== "all" ||
    genderFilter !== "all" ||
    (!lockedSubCommunity && groupFilter !== "all") ||
    seferFilter !== "all" ||
    ageGroupFilter !== "all" ||
    search !== ""

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setStatusFilter("all")
    setGenderFilter("all")
    setGroupFilter("all")
    setSeferFilter("all")
    setAgeGroupFilter("all")
  }

  const displayName = (m: Member) =>
    m.fullName || [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") || "—"

  // Client-side filtering over all loaded members.
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (lockedSubCommunity && m.subCommunity !== lockedSubCommunity) return false
      if (!lockedSubCommunity && groupFilter !== "all" && m.subCommunity !== groupFilter) {
        return false
      }
      if (statusFilter !== "all" && m.membershipStatus !== statusFilter) return false
      if (genderFilter !== "all" && m.gender !== genderFilter) return false
      if (seferFilter !== "all" && m.sefer !== seferFilter) return false
      if (ageGroupFilter !== "all" && m.ageGroup !== ageGroupFilter) return false
      if (search) {
        const name = displayName(m).toLowerCase()
        const phone = (m.phone || "").toLowerCase()
        if (!name.includes(search) && !phone.includes(search)) return false
      }
      return true
    })
  }, [
    members,
    lockedSubCommunity,
    statusFilter,
    genderFilter,
    groupFilter,
    seferFilter,
    ageGroupFilter,
    search,
  ])

  // Reset visible window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [statusFilter, genderFilter, groupFilter, seferFilter, ageGroupFilter, search, lockedSubCommunity])

  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length))
  }, [filtered.length])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, visibleItems.length])

  function handleDeleteClick(id: string) {
    setMemberToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!memberToDelete) return
    try {
      setDeleting(true)
      await deleteMember(memberToDelete)
      toast({ title: "Success", description: "Member deleted successfully" })
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    } catch {
      toast({ title: "Error", description: "Failed to delete member", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const statusBadge = (status: Member["membershipStatus"]) => {
    if (status === "Active") {
      return (
        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 hover:bg-green-50 border-0 font-medium">
          {t.members.active}
        </Badge>
      )
    }
    if (status === "Inactive") {
      return (
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-50 border-0 font-medium">
          {t.members.inactive}
        </Badge>
      )
    }
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted border-0 font-medium">
        {status}
      </Badge>
    )
  }

  const groupLabel = (g?: Member["subCommunity"]) => {
    switch (g) {
      case "Jemmo":
        return t.members.jemmo
      case "Bethel":
        return t.members.bethel
      case "Weyira":
        return t.members.weyira
      case "Alpha":
        return t.members.alfa
      default:
        return "—"
    }
  }

  const ageGroupLabel = (a?: Member["ageGroup"]) => {
    switch (a) {
      case "Children":
        return t.members.children
      case "Teenagers":
        return t.members.teenagers
      case "Youth":
        return t.members.youth
      case "Adults":
        return t.members.adults
      case "Seniors":
        return t.members.seniors
      default:
        return "—"
    }
  }

  const pageTitle = lockedSubCommunity
    ? locale === "am"
      ? `${groupLabel(lockedSubCommunity)} አባላት`
      : `${lockedSubCommunity} Members`
    : t.members.title

  const pageSubtitle = lockedSubCommunity
    ? locale === "am"
      ? `የ${groupLabel(lockedSubCommunity)} ንዑስ ማህበረሰብ አባላት`
      : `Members in the ${lockedSubCommunity} sub-community`
    : t.members.subtitle

  const addHref = newMemberHref(lockedCommunity)

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load members</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <PermissionGuard resource={Resource.CHURCH_MEMBER} action={Action.READ}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {!lockedSubCommunity && (
              <>
                <Link href="/members/analytics">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    {locale === "am" ? "የአባላት ትንታኔ" : "Member Analytics"}
                  </Button>
                </Link>
                <Link href="/members/import">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    {locale === "am" ? "ከ Excel አስገባ" : "Import Excel"}
                  </Button>
                </Link>
              </>
            )}
            <PermissionGuard resource={Resource.CHURCH_MEMBER} action={Action.CREATE} showError={false}>
              <Link href={addHref}>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.members.addMember}
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.members.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 bg-card"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] bg-card">
              <SelectValue placeholder={t.members.membershipStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.members.allStatuses}</SelectItem>
              <SelectItem value="Active">{t.members.active}</SelectItem>
              <SelectItem value="Inactive">{t.members.inactive}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[110px] bg-card">
              <SelectValue placeholder={t.members.gender} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.members.allGenders}</SelectItem>
              <SelectItem value="Male">{t.members.male}</SelectItem>
              <SelectItem value="Female">{t.members.female}</SelectItem>
            </SelectContent>
          </Select>

          {!lockedSubCommunity && (
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-9 w-auto min-w-[130px] bg-card">
                <SelectValue placeholder={locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church Group"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.members.allSubCommunities}</SelectItem>
                {CHURCH_GROUPS.map((g) => (
                  <SelectItem key={g} value={g as string}>
                    {groupLabel(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={seferFilter} onValueChange={setSeferFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] bg-card">
              <SelectValue placeholder={locale === "am" ? "ሰፈር" : "Sefer"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "am" ? "ሁሉም ሰፈሮች" : "All Sefers"}</SelectItem>
              {availableSefers.map((s) => (
                <SelectItem key={s._id} value={s.name}>
                  {locale === "am" && s.nameAmharic ? s.nameAmharic : s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] bg-card">
              <SelectValue placeholder={t.members.ageGroup} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.members.allAgeGroups}</SelectItem>
              {AGE_GROUPS.map((a) => (
                <SelectItem key={a} value={a}>
                  {ageGroupLabel(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={clearFilters}>
              <X className="w-4 h-4" />
              {t.members.clearFilters}
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <Table className="w-full text-base">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {locale === "am" ? "ተ.ቁ" : "No."}
                </TableHead>
                <TableHead className="px-3 text-sm font-semibold">
                  {locale === "am" ? "አባል" : "Member"}
                </TableHead>
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {locale === "am" ? "ስልክ" : "Phone"}
                </TableHead>
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {locale === "am" ? "ሰፈር" : "Sefer"}
                </TableHead>
                {!lockedSubCommunity && (
                  <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                    {locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church Group"}
                  </TableHead>
                )}
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {locale === "am" ? "ቤተሰብ" : "Family"}
                </TableHead>
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {t.members.ageGroup}
                </TableHead>
                <TableHead className="w-[1%] px-3 text-sm font-semibold whitespace-nowrap">
                  {t.members.membershipStatus}
                </TableHead>
                <TableHead className="w-[1%] px-2 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="px-3"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-4 w-24" /></TableCell>
                    {!lockedSubCommunity && (
                      <TableCell className="px-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    )}
                    <TableCell className="px-3"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="px-2"></TableCell>
                  </TableRow>
                ))
              ) : visibleItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={lockedSubCommunity ? 8 : 9}>
                    <div className="text-center py-14">
                      <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="text-base font-semibold mb-1">{t.members.noMembers}</h3>
                      <p className="text-base text-muted-foreground mb-4">
                        {hasActiveFilters
                          ? locale === "am"
                            ? "ማጣሪያዎችን ያስተካክሉ"
                            : "Try adjusting your search or filters"
                          : locale === "am"
                            ? "የመጀመሪያውን አባል ያክሉ"
                            : "Get started by adding your first member"}
                      </p>
                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          {t.members.clearFilters}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {!lockedSubCommunity && (
                            <Link href="/members/import">
                              <Button variant="secondary" size="sm" className="gap-2">
                                <FileSpreadsheet className="w-4 h-4" />
                                {locale === "am" ? "ከ Excel አስገባ" : "Import Excel"}
                              </Button>
                            </Link>
                          )}
                          <Link href={addHref}>
                            <Button size="sm" className="gap-2">
                              <Plus className="w-4 h-4" />
                              {t.members.addMember}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleItems.map((member, index) => {
                  const name = displayName(member)
                  const family = familyByMember[member.id]
                  return (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <TableCell className="px-3 text-base font-semibold tabular-nums text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-3">
                        <p className="text-base font-medium">{name}</p>
                      </TableCell>
                      <TableCell className="px-3 text-base text-muted-foreground whitespace-nowrap">
                        {member.phone || "—"}
                      </TableCell>
                      <TableCell className="px-3 text-base text-muted-foreground whitespace-nowrap">
                        {member.sefer || "—"}
                      </TableCell>
                      {!lockedSubCommunity && (
                        <TableCell className="px-3 whitespace-nowrap">
                          {member.subCommunity ? (
                            <Badge variant="outline" className="text-sm font-normal">
                              {groupLabel(member.subCommunity)}
                            </Badge>
                          ) : (
                            <span className="text-base text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {family ? (
                          <Link href={`/families/${family.familyId}`}>
                            <Badge
                              variant="outline"
                              className="text-sm font-normal hover:bg-accent transition-colors"
                            >
                              {family.familyName}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-base text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 text-base text-muted-foreground whitespace-nowrap">
                        {ageGroupLabel(member.ageGroup)}
                      </TableCell>
                      <TableCell className="px-3 whitespace-nowrap">
                        {statusBadge(member.membershipStatus)}
                      </TableCell>
                      <TableCell className="px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{locale === "am" ? "ድርጊቶች" : "Actions"}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/members/${member.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t.members.viewMember}
                              </Link>
                            </DropdownMenuItem>
                            {hasPermission(Resource.CHURCH_MEMBER, Action.UPDATE) && (
                              <DropdownMenuItem asChild>
                                <Link href={`/members/${member.id}/edit`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t.members.editMember}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {hasPermission(Resource.CHURCH_MEMBER, Action.DELETE) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(member.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t.members.deleteMember}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {!loading && hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {locale === "am" ? "ተጨማሪ በመጫን ላይ..." : "Loading more..."}
            </div>
          )}
        </Card>

        {/* Footer: count */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {locale === "am"
              ? `${visibleItems.length} ከ ${filtered.length} አባላት`
              : `Showing ${visibleItems.length} of ${filtered.length}${
                  filtered.length !== members.length ? ` (${members.length} total)` : ""
                }`}
          </p>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.members.deleteMember}</AlertDialogTitle>
              <AlertDialogDescription>{t.members.deleteConfirmation}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.members.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : t.members.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
