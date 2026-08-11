"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Printer,
  ChevronDown,
  StickyNote,
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
import { searchFamilies } from "@/lib/families-api"
import type { Family, Member, SubCommunity } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"
import {
  newMemberHref,
  SUB_COMMUNITY_BY_SLUG,
  AGE_GROUP_BY_SLUG,
  type SubCommunitySlug,
  type AgeGroupSlug,
} from "@/lib/sub-communities"
import { ageGroupForRole } from "@/lib/role-utils"
import { useMyNotedMemberIds } from "@/hooks/use-my-noted-member-ids"
import { cn } from "@/lib/utils"

const BATCH_SIZE = 30

type SplitterKey =
  | "jemmo"
  | "bethel"
  | "weyira"
  | "alpha"
  | "youth"
  | "teenagers"
  | "children"
  | "parents"
  | "hasCellGroup"
  | "learnedSalvation"
  | "learnedDiscipleship"
  | "serving"
  | "notServing"

const COMMUNITY_KEYS: SplitterKey[] = ["jemmo", "bethel", "weyira", "alpha"]
const AGE_KEYS: SplitterKey[] = ["youth", "teenagers", "children", "parents"]

const COMMUNITY_TO_UI: Record<string, SubCommunity> = {
  jemmo: "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alpha: "Alpha",
}

/** Family lookup entry keyed by member id. */
interface FamilyRef {
  familyId: string
  familyName: string
  fatherPhone?: string
  motherPhone?: string
}

function memberPhoneFromFamilyEntry(
  entry: Family["members"][number] | undefined,
  membersById: Record<string, Member>,
): string | undefined {
  if (!entry) return undefined
  if (typeof entry.memberId === "object" && entry.memberId) {
    return entry.memberId.phoneNumber || membersById[entry.memberId._id]?.phone || undefined
  }
  if (typeof entry.memberId === "string") {
    return membersById[entry.memberId]?.phone || undefined
  }
  return undefined
}

export function MembersListPage({
  lockedCommunity,
  lockedAgeGroup,
}: {
  lockedCommunity?: SubCommunitySlug
  lockedAgeGroup?: AgeGroupSlug
} = {}) {
  const lockedSubCommunity: SubCommunity | undefined = lockedCommunity
    ? SUB_COMMUNITY_BY_SLUG[lockedCommunity].label
    : undefined
  const lockedAgeLabel = lockedAgeGroup
    ? AGE_GROUP_BY_SLUG[lockedAgeGroup].label
    : undefined
  const isChildrenView = lockedAgeLabel === "Children"

  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const router = useRouter()
  const { hasPermission, user } = useAuth()
  const { members, loading, error, deleteMember } = useMembers()
  const { notedMemberIds } = useMyNotedMemberIds()
  const roleScopedAge = ageGroupForRole(user?.role)
  const scopedAgeGroup = lockedAgeLabel || roleScopedAge

  // Search (debounced) + multi-select splitter filters
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<SplitterKey[]>([])

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // member -> family map (fetched once)
  const [familyByMember, setFamilyByMember] = useState<Record<string, FamilyRef>>({})

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const membersById = useMemo(() => {
    const map: Record<string, Member> = {}
    for (const m of members) map[m.id] = m
    return map
  }, [members])

  const splitterOptions = useMemo(() => {
    const communityOptions: { key: SplitterKey; label: string }[] = lockedSubCommunity
      ? []
      : [
          { key: "jemmo", label: t.members.jemmo },
          { key: "bethel", label: t.members.bethel },
          { key: "weyira", label: t.members.weyira },
          { key: "alpha", label: t.members.alfa },
        ]

    const ageOptions: { key: SplitterKey; label: string }[] = scopedAgeGroup
      ? []
      : [
          { key: "youth", label: t.members.youth },
          { key: "teenagers", label: t.members.teenagers },
          { key: "children", label: t.members.children },
          { key: "parents", label: t.members.parents },
        ]

    return [
      ...communityOptions,
      ...ageOptions,
      { key: "hasCellGroup" as const, label: t.members.hasCellGroup },
      { key: "learnedSalvation" as const, label: t.members.learnedSalvation },
      { key: "learnedDiscipleship" as const, label: t.members.learnedDiscipleship },
      { key: "serving" as const, label: t.members.servingInMinistry },
      { key: "notServing" as const, label: t.members.notServingInMinistry },
    ]
  }, [lockedSubCommunity, scopedAgeGroup, t])

  // Debounce the search input (300ms).
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  // Build the family lookup map (includes parent phones for children view).
  useEffect(() => {
    searchFamilies("", 1, 500)
      .then((res) => {
        const map: Record<string, FamilyRef> = {}
        for (const family of res.data) {
          const familyName = family.name || (locale === "am" ? "ቤተሰብ" : "Family")
          const father = family.members.find((m) => m.role === "father")
          const mother = family.members.find((m) => m.role === "mother")
          const fatherPhone = memberPhoneFromFamilyEntry(father, membersById)
          const motherPhone = memberPhoneFromFamilyEntry(mother, membersById)

          for (const fm of family.members) {
            const id = typeof fm.memberId === "object" ? fm.memberId._id : fm.memberId
            if (id) {
              map[id] = {
                familyId: family._id,
                familyName,
                fatherPhone,
                motherPhone,
              }
            }
          }
        }
        setFamilyByMember(map)
      })
      .catch(() => setFamilyByMember({}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersById])

  const hasActiveFilters = selectedFilters.length > 0 || search !== ""

  function clearFilters() {
    setSearchInput("")
    setSearch("")
    setSelectedFilters([])
  }

  function toggleFilter(key: SplitterKey) {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const displayName = (m: Member) =>
    m.fullName || [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") || "—"

  // All members in scope (community/age locked or entire church), ignoring other filters.
  const allInScope = useMemo(() => {
    return members.filter((m) => {
      if (m.membershipStatus !== "Active") return false
      if (lockedSubCommunity && m.subCommunity !== lockedSubCommunity) return false
      if (scopedAgeGroup && m.ageGroup !== scopedAgeGroup) return false
      return true
    })
  }, [members, lockedSubCommunity, scopedAgeGroup])

  function matchesSplitter(m: Member, selected: SplitterKey[]): boolean {
    if (selected.length === 0) return true

    const selectedSet = new Set(selected)

    const communities = COMMUNITY_KEYS.filter((k) => selectedSet.has(k))
    if (communities.length > 0) {
      const ok = communities.some((k) => m.subCommunity === COMMUNITY_TO_UI[k])
      if (!ok) return false
    }

    const ages = AGE_KEYS.filter((k) => selectedSet.has(k))
    if (ages.length > 0) {
      const ok = ages.some((k) => {
        if (k === "parents") return m.ageGroup === "Adults" || m.ageGroup === "Seniors"
        if (k === "youth") return m.ageGroup === "Youth"
        if (k === "teenagers") return m.ageGroup === "Teenagers"
        if (k === "children") return m.ageGroup === "Children"
        return false
      })
      if (!ok) return false
    }

    if (selectedSet.has("hasCellGroup")) {
      const hasCell =
        m.currentGroupType === "Cell Group" ||
        Boolean(m.cellGroupName?.trim()) ||
        Boolean(m.cellGroupNumber?.trim())
      if (!hasCell) return false
    }

    if (selectedSet.has("learnedSalvation")) {
      if (!m.salvationYearEthiopian?.trim()) return false
    }

    if (selectedSet.has("learnedDiscipleship")) {
      if (m.catechesisStatus !== "Completed") return false
    }

    const servingSelected = selectedSet.has("serving")
    const notServingSelected = selectedSet.has("notServing")
    const isServing = (m.currentServices?.length ?? 0) > 0
    if (servingSelected && !notServingSelected && !isServing) return false
    if (notServingSelected && !servingSelected && isServing) return false

    return true
  }

  // Client-side filtering over all loaded members.
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (m.membershipStatus !== "Active") return false
      if (lockedSubCommunity && m.subCommunity !== lockedSubCommunity) return false
      if (scopedAgeGroup && m.ageGroup !== scopedAgeGroup) return false
      if (!matchesSplitter(m, selectedFilters)) return false
      if (search) {
        const name = displayName(m).toLowerCase()
        const phone = (m.phone || "").toLowerCase()
        if (!name.includes(search) && !phone.includes(search)) return false
      }
      return true
    })
  }, [members, lockedSubCommunity, scopedAgeGroup, selectedFilters, search])

  // Reset visible window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [selectedFilters, search, lockedSubCommunity, scopedAgeGroup])

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
    : lockedAgeLabel
      ? locale === "am"
        ? `${ageGroupLabel(lockedAgeLabel)} አባላት`
        : `${lockedAgeLabel} Members`
      : t.members.title

  const pageSubtitle = lockedSubCommunity
    ? locale === "am"
      ? `የ${groupLabel(lockedSubCommunity)} ንዑስ ማህበረሰብ አባላት`
      : `Members in the ${lockedSubCommunity} sub-community`
    : lockedAgeLabel
      ? locale === "am"
        ? `የ${ageGroupLabel(lockedAgeLabel)} ዝርዝር`
        : `${lockedAgeLabel} members list`
      : t.members.subtitle

  const addHref = newMemberHref(lockedCommunity, lockedAgeGroup)

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  function printMembers(mode: "all" | "filtered") {
    const rows = mode === "all" ? allInScope : filtered
    if (rows.length === 0) {
      toast({
        title: locale === "am" ? "ምንም አባል የለም" : "No members to print",
        description:
          locale === "am"
            ? "ለመታተም የሚያስችል አባል አልተገኘም"
            : "There are no members in this selection.",
        variant: "destructive",
      })
      return
    }

    const showGroup = !lockedSubCommunity
    const subtitle =
      mode === "filtered" && hasActiveFilters
        ? locale === "am"
          ? "የተጣራ ዝርዝር"
          : "Filtered list"
        : locale === "am"
          ? "ሙሉ ዝርዝር"
          : "Full list"
    const printedAt = new Date().toLocaleString(locale === "am" ? "am-ET" : undefined)

    const headers = isChildrenView
      ? [
          locale === "am" ? "ተ.ቁ" : "No.",
          locale === "am" ? "ስም" : "Name",
          locale === "am" ? "የአባት ስልክ" : "Father's Phone Number",
          locale === "am" ? "የእናት ስልክ" : "Mother's Phone Number",
        ]
      : [
          locale === "am" ? "ተ.ቁ" : "No.",
          locale === "am" ? "አባል" : "Member",
          locale === "am" ? "ስልክ" : "Phone",
          locale === "am" ? "ሰፈር" : "Sefer",
          ...(showGroup ? [locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church Group"] : []),
          locale === "am" ? "ቤተሰብ" : "Family",
          t.members.ageGroup,
          t.members.membershipStatus,
        ]

    const body = rows
      .map((member, index) => {
        const family = familyByMember[member.id]
        const cells = isChildrenView
          ? [
              String(index + 1),
              displayName(member),
              family?.fatherPhone || "—",
              family?.motherPhone || "—",
            ]
          : [
              String(index + 1),
              displayName(member),
              member.phone || "—",
              member.sefer || "—",
              ...(showGroup ? [groupLabel(member.subCommunity)] : []),
              family?.familyName || "—",
              ageGroupLabel(member.ageGroup),
              member.membershipStatus || "—",
            ]
        return `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
      })
      .join("")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    @page { margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 16px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f3f3; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
  </style>
</head>
<body>
  <h1>${escapeHtml(pageTitle)}</h1>
  <div class="meta">
    ${escapeHtml(subtitle)} · ${rows.length} ${locale === "am" ? "አባላት" : "members"} · ${escapeHtml(printedAt)}
  </div>
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`

    const iframe = document.createElement("iframe")
    iframe.setAttribute("title", "Print members")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    iframe.style.opacity = "0"
    iframe.style.pointerEvents = "none"
    document.body.appendChild(iframe)

    const frameWindow = iframe.contentWindow
    const frameDocument = frameWindow?.document
    if (!frameWindow || !frameDocument) {
      iframe.remove()
      toast({
        title: locale === "am" ? "ማተም አልተቻለም" : "Unable to print",
        description:
          locale === "am"
            ? "እባክዎ እንደገና ይሞክሩ"
            : "Please try again.",
        variant: "destructive",
      })
      return
    }

    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000)
    }

    const triggerPrint = () => {
      try {
        frameWindow.focus()
        frameWindow.print()
      } catch {
        toast({
          title: locale === "am" ? "ማተም አልተቻለም" : "Unable to print",
          description:
            locale === "am"
              ? "እባክዎ እንደገና ይሞክሩ"
              : "Please try again.",
          variant: "destructive",
        })
      } finally {
        cleanup()
      }
    }

    if (frameDocument.readyState === "complete") {
      setTimeout(triggerPrint, 50)
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 50)
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
            <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {!lockedSubCommunity && !lockedAgeGroup && (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
                  <Printer className="w-4 h-4" />
                  {locale === "am" ? "አትም" : "Print"}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {locale === "am" ? "የህትመት አማራጮች" : "Print options"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => printMembers("all")}>
                  {locale === "am"
                    ? `ሁሉንም አትም (${allInScope.length})`
                    : `Print all (${allInScope.length})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => printMembers("filtered")}>
                  {locale === "am"
                    ? `የተጣራውን አትም (${filtered.length})`
                    : `Print filtered (${filtered.length})`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Toolbar: search + multi-select splitter */}
        <div className="space-y-3">
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="w-4 h-4" />
                {t.members.clearFilters}
              </Button>
            )}
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={locale === "am" ? "የአባላት ማጣሪያዎች" : "Member filters"}
          >
            {splitterOptions.map((opt) => {
              const active = selectedFilters.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFilter(opt.key)}
                  className={cn(
                    "h-8 rounded-md border px-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
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
                  {locale === "am" ? "ስም" : "Name"}
                </TableHead>
                {isChildrenView ? (
                  <>
                    <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                      {locale === "am" ? "የአባት ስልክ" : "Father's Phone Number"}
                    </TableHead>
                    <TableHead className="px-3 text-sm font-semibold whitespace-nowrap">
                      {locale === "am" ? "የእናት ስልክ" : "Mother's Phone Number"}
                    </TableHead>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <TableHead className="w-[1%] px-2 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="px-3"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell className="px-3"><Skeleton className="h-4 w-40" /></TableCell>
                    {isChildrenView ? (
                      <>
                        <TableCell className="px-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="px-3"><Skeleton className="h-4 w-28" /></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="px-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="px-3"><Skeleton className="h-4 w-24" /></TableCell>
                        {!lockedSubCommunity && (
                          <TableCell className="px-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        )}
                        <TableCell className="px-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="px-3"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="px-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      </>
                    )}
                    <TableCell className="px-2"></TableCell>
                  </TableRow>
                ))
              ) : visibleItems.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={isChildrenView ? 5 : lockedSubCommunity ? 8 : 9}>
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
                          {!lockedSubCommunity && !lockedAgeGroup && (
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
                        <div className="flex items-center gap-2">
                          <p className="text-base font-medium">{name}</p>
                          {notedMemberIds.has(member.id) && (
                            <span
                              title={locale === "am" ? "የእርስዎ ማስታወሻ አለ" : "You have a note"}
                              className="inline-flex text-amber-600 dark:text-amber-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StickyNote className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {isChildrenView ? (
                        <>
                          <TableCell className="px-3 text-base text-muted-foreground whitespace-nowrap">
                            {family?.fatherPhone || "—"}
                          </TableCell>
                          <TableCell className="px-3 text-base text-muted-foreground whitespace-nowrap">
                            {family?.motherPhone || "—"}
                          </TableCell>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
