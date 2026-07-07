"use client"

import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const COMMUNITY_COLORS: Record<string, string> = {
  jemmo: "#6366f1",
  bethel: "#8b5cf6",
  weyira: "#06b6d4",
  alfa: "#10b981",
}
const COLOR_LIST = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"]

function cap(s: string | undefined) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export default function CommunitiesReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: dashboardData, isLoading } = useDashboardStats()
  const community = dashboardData?.data?.community
  const overview = dashboardData?.data?.overview

  const communityData = (community?.subCommunityStats || []).map((s, i) => ({
    name: cap(s.subCommunity),
    key: s.subCommunity,
    count: s.count,
    percentage: s.percentage,
    color: COMMUNITY_COLORS[s.subCommunity] ?? COLOR_LIST[i % COLOR_LIST.length],
  }))

  const total = overview?.totalMembers || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.categories.communities.title}</h1>
          <p className="text-muted-foreground">{tr.reports.communitiesPage.subtitle}</p>
        </div>
      </div>

      {/* Community summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} variant="glass" hover="lift">
                <CardHeader className="pb-2"><Skeleton className="h-4 w-16" /></CardHeader>
                <CardContent><Skeleton className="h-9 w-12" /></CardContent>
              </Card>
            ))
          : communityData.map((c) => (
              <Card key={c.key} variant="glass" hover="lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wide" style={{ color: c.color }}>
                    {c.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{c.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {total > 0 ? Math.round((c.count / total) * 100) : 0}% {tr.reports.communitiesPage.ofTotal}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Bar chart comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.communitiesPage.membersPerCommunity}</CardTitle>
            <CardDescription>{tr.reports.communitiesPage.totalMemberCount}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={communityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {communityData.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.communitiesPage.shareOfTotal}</CardTitle>
            <CardDescription>{tr.reports.communitiesPage.percentageBreakdown}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-3 mt-2">
                {communityData.map((c) => {
                  const pct = total > 0 ? Math.round((c.count / total) * 100) : 0
                  return (
                    <div key={c.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-semibold">{c.name}</span>
                        <span className="text-sm font-bold">{c.count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-white/10 flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{tr.reports.communitiesPage.total}</span>
                  <span className="font-bold">{total.toLocaleString()} {tr.reports.communitiesPage.members}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group type breakdown */}
      {(community?.groupTypeStats || []).length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.communitiesPage.groupTypeDistribution}</CardTitle>
            <CardDescription>{tr.reports.communitiesPage.groupTypeDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 font-bold text-muted-foreground">{tr.reports.communitiesPage.groupType}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.communitiesPage.members}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.communitiesPage.percentOfTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(community?.groupTypeStats || []).map((row, i) => {
                      const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : "0"
                      return (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: COLOR_LIST[i % COLOR_LIST.length] }} />
                              <span className="font-medium capitalize">{row.groupType.replace(/_/g, " ")}</span>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-3 font-bold">{row.count.toLocaleString()}</td>
                          <td className="text-right py-2.5 px-3 text-muted-foreground">{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
