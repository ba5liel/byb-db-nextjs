"use client"

import { useState } from "react"
import { use } from "react"
import Link from "next/link"
import {
  ArrowLeft, Users, Grid3x3, UserCheck, ChevronLeft, ChevronRight,
  Search, BarChart3,
} from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useMembers } from "@/lib/api/hooks"
import { useSubCommunityStats, useCommunityOverview } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { SubCommunity } from "@/lib/api/types"

const COMMUNITY_LABELS: Record<string, string> = {
  jemmo:  "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alfa:   "Alfa",
}

const STATUS_COLORS: Record<string, string> = {
  active:      "bg-green-500/10 text-green-500",
  inactive:    "bg-yellow-500/10 text-yellow-500",
  removed:     "bg-red-500/10 text-red-500",
  transferred: "bg-blue-500/10 text-blue-500",
  deceased:    "bg-gray-500/10 text-gray-400",
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]

function cap(s: string | undefined) {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ''
}

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = use(params)
  const label = COMMUNITY_LABELS[community] ?? cap(community)
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  const handleSearchSubmit = () => {
    setDebouncedSearch(search)
    setPage(1)
  }

  const { data: membersData, isLoading: membersLoading } = useMembers({
    subCommunity: community as SubCommunity,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    page,
    limit: 20,
  })

  const { data: statsData, isLoading: statsLoading } = useSubCommunityStats(community)
  const { data: cgData, isLoading: cgLoading } = useCommunityOverview(community)

  const members = Array.isArray(membersData?.data)
    ? (membersData.data as unknown[])
    : ((membersData?.data as unknown as { members?: unknown[] })?.members ?? [])
  const pagination = membersData?.pagination
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  const stats = statsData?.data
  const cellGroups = cgData?.data?.cellGroups ?? []
  const activeCellGroups = cellGroups.filter(cg => cg.isActive).length

  const ageData = (stats?.ageGroupBreakdown ?? []).map(s => ({
    name: cap(s.ageGroup),
    count: s.count,
  }))

  const groupData = (stats?.groupTypeBreakdown ?? [])
    .filter(s => s.count > 0)
    .map(s => ({ name: cap(s.groupType), value: s.count }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sub-communities" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.subCommunities.community.replace("{name}", label)}</h1>
          <p className="text-muted-foreground capitalize">{community} sub-community</p>
        </div>
        <div className="ml-auto">
          <Link href={`/sub-communities/${community}/cell-groups`}>
            <Button variant="outline" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              {tr.subCommunities.manageCellGroups}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.totalMembers}</p>
                {statsLoading ? <Skeleton className="h-7 w-14 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{(stats?.totalMembers ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.activeMembers}</p>
                {statsLoading ? <Skeleton className="h-7 w-12 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{(stats?.activeMembers ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.maleFemale}</p>
                {statsLoading ? <Skeleton className="h-7 w-16 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{stats?.maleCount ?? 0} / {stats?.femaleCount ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.cellGroupsLabel}</p>
                {cgLoading ? <Skeleton className="h-7 w-10 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{activeCellGroups}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Members | Demographics */}
      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            {tr.subCommunities.membersTab}
          </TabsTrigger>
          <TabsTrigger value="demographics">
            <BarChart3 className="w-4 h-4 mr-2" />
            {tr.subCommunities.demographicsTab}
          </TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={tr.subCommunities.searchMembers}
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
                    onBlur={handleSearchSubmit}
                  />
                </div>
                {pagination && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    {pagination.total.toLocaleString()} members
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">#</th>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.common.name}</th>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.common.phone}</th>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.subCommunities.groupType}</th>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.subCommunities.cellNumber}</th>
                      <th className="text-left py-3 px-4 font-bold text-muted-foreground">{tr.common.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      [...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {[...Array(6)].map((_, j) => (
                            <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : (members as Record<string, unknown>[]).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          {tr.subCommunities.noMembersFound}
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
                          <td className="py-3 px-4 text-muted-foreground">{String(member.phoneNumber || "—")}</td>
                          <td className="py-3 px-4 capitalize text-muted-foreground">
                            {member.groupType ? cap(String(member.groupType)) : "—"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                            {member.cellGroupNumber ? String(member.cellGroupNumber) : "—"}
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

              {pagination && pagination.total > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                  <span className="text-sm text-muted-foreground">
                    Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold px-2">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics tab */}
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg font-bold">{tr.subCommunities.ageGroupDistribution}</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : ageData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ageData} margin={{ left: -20, right: 10 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ fontWeight: "bold" }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg font-bold">{tr.subCommunities.groupTypeBreakdown}</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : groupData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={groupData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                        labelLine={false}
                      >
                        {groupData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Cell group list */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{tr.subCommunities.cellGroupsLabel}</CardTitle>
                  <Link href={`/sub-communities/${community}/cell-groups`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Grid3x3 className="w-4 h-4" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {cgLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : cellGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {tr.subCommunities.noCellGroups}{" "}
                    <Link href={`/sub-communities/${community}/cell-groups`} className="text-primary hover:underline">
                      {tr.subCommunities.addOne}
                    </Link>
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cellGroups.map(cg => {
                      const leader = typeof cg.leaderId === "object" && cg.leaderId !== null
                        ? cg.leaderId
                        : null
                      return (
                        <div
                          key={cg._id}
                          className={`p-4 rounded-xl border ${cg.isActive ? "border-white/10 bg-white/5" : "border-white/5 bg-white/2 opacity-60"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">
                              Cell {cg.cellNumber}
                              {cg.name && ` — ${cg.name}`}
                            </span>
                            {!cg.isActive && (
                              <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full">{tr.subCommunities.inactive}</span>
                            )}
                          </div>
                          {leader && (
                            <p className="text-xs text-muted-foreground">
                              Leader: {(leader as { fullName?: string }).fullName}
                            </p>
                          )}
                          {cg.meetingSchedule && (
                            <p className="text-xs text-muted-foreground mt-0.5">{cg.meetingSchedule}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
