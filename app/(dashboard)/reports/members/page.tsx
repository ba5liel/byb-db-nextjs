"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useMembers } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { MemberFilters, MemberStatus, SubCommunity, Sex, AgeGroup } from "@/lib/api/types"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500",
  inactive: "bg-yellow-500/10 text-yellow-500",
  removed: "bg-red-500/10 text-red-500",
  transferred: "bg-blue-500/10 text-blue-500",
  deceased: "bg-gray-500/10 text-gray-400",
}

function cap(s: string | undefined) {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ''
}

export default function MemberDirectoryReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [subCommunity, setSubCommunity] = useState<string>("all")
  const [sex, setSex] = useState<string>("all")
  const [status, setStatus] = useState<string>("active")
  const [ageGroup, setAgeGroup] = useState<string>("all")
  const [page, setPage] = useState(1)

  // Simple debounce via onBlur / enter key
  const handleSearchSubmit = () => {
    setDebouncedSearch(search)
    setPage(1)
  }

  const filters: MemberFilters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(subCommunity !== "all" ? { subCommunity: subCommunity as SubCommunity } : {}),
    ...(sex !== "all" ? { sex: sex as Sex } : {}),
    ...(status !== "all" ? { memberStatus: status as MemberStatus } : {}),
    ...(ageGroup !== "all" ? { ageGroup: ageGroup as AgeGroup } : {}),
    page,
    limit: 20,
  }

  const { data: membersData, isLoading } = useMembers(filters)
  const members = (membersData?.data as unknown as { members?: unknown[] })?.members
    ?? (Array.isArray(membersData?.data) ? membersData?.data : []) as unknown[]
  const pagination = membersData?.pagination

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.memberDirectoryPage.title}</h1>
          <p className="text-muted-foreground">
            {pagination ? tr.reports.memberDirectoryPage.membersFound.replace("{total}", pagination.total.toLocaleString()) : tr.reports.memberDirectoryPage.subtitle}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">{tr.reports.memberDirectoryPage.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tr.reports.memberDirectoryPage.searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
                onBlur={handleSearchSubmit}
              />
            </div>

            <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder={tr.common.status} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.reports.memberDirectoryPage.allStatuses}</SelectItem>
                <SelectItem value="active">{tr.reports.memberDirectoryPage.active}</SelectItem>
                <SelectItem value="inactive">{tr.reports.memberDirectoryPage.inactive}</SelectItem>
                <SelectItem value="removed">{tr.reports.memberDirectoryPage.removed}</SelectItem>
                <SelectItem value="transferred">{tr.reports.memberDirectoryPage.transferred}</SelectItem>
                <SelectItem value="deceased">{tr.reports.memberDirectoryPage.deceased}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subCommunity} onValueChange={v => { setSubCommunity(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder={tr.reports.memberDirectoryPage.community} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.reports.memberDirectoryPage.allCommunities}</SelectItem>
                <SelectItem value="jemmo">Jemmo</SelectItem>
                <SelectItem value="bethel">Bethel</SelectItem>
                <SelectItem value="weyira">Weyira</SelectItem>
                <SelectItem value="alfa">Alfa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sex} onValueChange={v => { setSex(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder={tr.reports.memberDirectoryPage.sex} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.reports.memberDirectoryPage.allSexes}</SelectItem>
                <SelectItem value="male">{tr.reports.memberDirectoryPage.male}</SelectItem>
                <SelectItem value="female">{tr.reports.memberDirectoryPage.female}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            <Select value={ageGroup} onValueChange={v => { setAgeGroup(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder={tr.reports.memberDirectoryPage.ageGroup} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.reports.memberDirectoryPage.allAges}</SelectItem>
                <SelectItem value="children">{tr.reports.memberDirectoryPage.childrenAge}</SelectItem>
                <SelectItem value="teenagers">{tr.reports.memberDirectoryPage.teenagersAge}</SelectItem>
                <SelectItem value="youth">{tr.reports.memberDirectoryPage.youthAge}</SelectItem>
                <SelectItem value="adults">{tr.reports.memberDirectoryPage.adultsAge}</SelectItem>
                <SelectItem value="seniors">{tr.reports.memberDirectoryPage.seniorsAge}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card variant="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">#</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.common.name}</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.reports.memberDirectoryPage.membershipNo}</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.reports.memberDirectoryPage.phone}</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.reports.memberDirectoryPage.community}</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.reports.memberDirectoryPage.ageGroup}</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : (members as Record<string, unknown>[]).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {tr.reports.memberDirectoryPage.noMembersFound}
                    </td>
                  </tr>
                ) : (
                  (members as Record<string, unknown>[]).map((member, i) => (
                    <tr key={String(member._id)} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {((page - 1) * 20) + i + 1}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/members/${member._id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {String(member.fullName)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {String(member.membershipNumber || "—")}
                      </td>
                      <td className="py-3 px-4">{String(member.phoneNumber || "—")}</td>
                      <td className="py-3 px-4 capitalize">{String(member.subCommunity || "—")}</td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">
                        {member.ageGroup ? cap(String(member.ageGroup)) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[String(member.memberStatus)] ?? "bg-white/10 text-foreground"}`}>
                          {String(member.memberStatus || "—")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-sm text-muted-foreground">
                {tr.reports.showing
                  .replace("{start}", String(((page - 1) * 20) + 1))
                  .replace("{end}", String(Math.min(page * 20, pagination.total)))
                  .replace("{total}", pagination.total.toLocaleString())}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold px-2">
                  {tr.reports.memberDirectoryPage.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
