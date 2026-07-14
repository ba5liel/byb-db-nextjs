"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  AlertCircle,
  BarChart3,
  MoreHorizontal,
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
import type { Member, Sefer } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"

const PAGE_SIZE = 20

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

export default function MembersPage() {
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

  const [page, setPage] = useState(1)

  // Sefer options + member -> family map (fetched once)
  const [sefers, setSefers] = useState<Sefer[]>([])
  const [familyByMember, setFamilyByMember] = useState<Record<string, FamilyRef>>({})

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    groupFilter !== "all" ||
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
      if (statusFilter !== "all" && m.membershipStatus !== statusFilter) return false
      if (genderFilter !== "all" && m.gender !== genderFilter) return false
      if (groupFilter !== "all" && m.subCommunity !== groupFilter) return false
      if (seferFilter !== "all" && m.sefer !== seferFilter) return false
      if (ageGroupFilter !== "all" && m.ageGroup !== ageGroupFilter) return false
      if (search) {
        const name = displayName(m).toLowerCase()
        const phone = (m.phone || "").toLowerCase()
        if (!name.includes(search) && !phone.includes(search)) return false
      }
      return true
    })
  }, [members, statusFilter, genderFilter, groupFilter, seferFilter, ageGroupFilter, search])

  // Reset to first page whenever the result set changes.
  useEffect(() => {
    setPage(1)
  }, [statusFilter, genderFilter, groupFilter, seferFilter, ageGroupFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
            <h1 className="text-2xl font-semibold tracking-tight">{t.members.title}</h1>
            <p className="text-sm text-muted-foreground">{t.members.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/members/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                {locale === "am" ? "የአባላት ትንታኔ" : "Member Analytics"}
              </Button>
            </Link>
            <PermissionGuard resource={Resource.CHURCH_MEMBER} action={Action.CREATE} showError={false}>
              <Link href="/members/new">
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

          <Select value={seferFilter} onValueChange={setSeferFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] bg-card">
              <SelectValue placeholder={locale === "am" ? "ሰፈር" : "Sefer"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "am" ? "ሁሉም ሰፈሮች" : "All Sefers"}</SelectItem>
              {sefers.map((s) => (
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{locale === "am" ? "አባል" : "Member"}</TableHead>
                <TableHead>{locale === "am" ? "ስልክ" : "Phone"}</TableHead>
                <TableHead>{locale === "am" ? "ሰፈር" : "Sefer"}</TableHead>
                <TableHead>{locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church Group"}</TableHead>
                <TableHead>{locale === "am" ? "ቤተሰብ" : "Family"}</TableHead>
                <TableHead>{t.members.ageGroup}</TableHead>
                <TableHead>{t.members.membershipStatus}</TableHead>
                <TableHead className="w-[52px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : pageItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8}>
                    <div className="text-center py-14">
                      <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold mb-1">{t.members.noMembers}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
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
                        <Link href="/members/new">
                          <Button size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t.members.addMember}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((member) => {
                  const name = displayName(member)
                  const family = familyByMember[member.id]
                  return (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{name}</p>
                            {member.membershipNumber && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.membershipNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.sefer || "—"}
                      </TableCell>
                      <TableCell>
                        {member.subCommunity ? (
                          <Badge variant="outline" className="font-normal">
                            {groupLabel(member.subCommunity)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {family ? (
                          <Link href={`/families/${family.familyId}`}>
                            <Badge
                              variant="outline"
                              className="font-normal hover:bg-accent transition-colors"
                            >
                              {family.familyName}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ageGroupLabel(member.ageGroup)}
                      </TableCell>
                      <TableCell>{statusBadge(member.membershipStatus)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
        </Card>

        {/* Footer: count + pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {locale === "am"
                ? `ከ${members.length} ${pageItems.length} ማሳየት`
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    currentPage * PAGE_SIZE,
                    filtered.length,
                  )} of ${filtered.length}${
                    filtered.length !== members.length ? ` (${members.length} total)` : ""
                  }`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {locale === "am" ? "ቀዳሚ" : "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground px-1">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {locale === "am" ? "ቀጣይ" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
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
