"use client"

import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import { ArrowLeft, Users, Briefcase, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useServiceStats, useDashboardStats } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const SERVICE_TYPE_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#84cc16", "#14b8a6",
]

function cap(s: string | undefined) {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ''
}

export default function ServicesReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: serviceData, isLoading: serviceLoading } = useServiceStats()
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats()
  const isLoading = serviceLoading || dashLoading

  const stats = serviceData?.data
  const overview = dashboardData?.data?.overview

  const topServicesData = (stats?.topServices || []).map(s => ({
    name: s.serviceName.length > 18 ? s.serviceName.slice(0, 18) + "…" : s.serviceName,
    fullName: s.serviceName,
    members: s.memberCount,
  }))

  const typeData = (stats?.serviceTypeBreakdown || []).map(t => ({
    name: cap(t.type),
    services: t.count,
    members: t.totalMembers,
  }))

  const totalMembers = overview?.totalMembers || 0
  const totalEnrollments = stats?.totalEnrollments || 0
  const servingPct = totalMembers > 0 ? Math.round((totalEnrollments / totalMembers) * 100) : 0
  const notServingPct = 100 - servingPct

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.categories.servicesMinistry.title}</h1>
          <p className="text-muted-foreground">{tr.reports.servicesPage.subtitle}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} variant="glass" hover="lift">
              <CardHeader className="pb-3"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-20" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.servicesPage.activeServices}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-indigo-500">{stats?.activeServices ?? 0}</div>
                  <Briefcase className="w-10 h-10 text-indigo-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.servicesPage.totalEnrollments}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-purple-500">{stats?.totalEnrollments ?? 0}</div>
                  <Users className="w-10 h-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.servicesPage.membersServing}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-green-500">{servingPct}%</div>
                  <TrendingUp className="w-10 h-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.servicesPage.notYetServing}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-orange-500">{notServingPct}%</div>
                  <AlertCircle className="w-10 h-10 text-orange-500/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Services + Serving breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.servicesPage.topServicesByEnrollment}</CardTitle>
            <CardDescription>{tr.reports.servicesPage.mostPopularServices}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : topServicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topServicesData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    formatter={(v: number, _: string, props) => [v.toLocaleString(), props.payload?.fullName || "Members"]}
                  />
                  <Bar dataKey="members" radius={[0, 4, 4, 0]}>
                    {topServicesData.map((_, i) => (
                      <Cell key={i} fill={SERVICE_TYPE_COLORS[i % SERVICE_TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{tr.reports.servicesPage.noData}</p>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.servicesPage.servingParticipation}</CardTitle>
            <CardDescription>{tr.reports.servicesPage.activeVsNotServing}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                      {tr.reports.servicesPage.serving}
                    </span>
                    <span className="text-sm font-bold">{totalEnrollments.toLocaleString()} ({servingPct}%)</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${servingPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                      {tr.reports.servicesPage.notServing}
                    </span>
                    <span className="text-sm font-bold">{(totalMembers - totalEnrollments).toLocaleString()} ({notServingPct}%)</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${notServingPct}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tr.reports.servicesPage.avgMembersPerService}</span>
                    <span className="font-bold">{stats?.averageMembersPerService?.toFixed(1) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tr.reports.servicesPage.totalServices}</span>
                    <span className="font-bold">{stats?.totalServices ?? "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Types */}
      {typeData.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.servicesPage.byServiceType}</CardTitle>
            <CardDescription>{tr.reports.servicesPage.serviceTypeDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 font-bold text-muted-foreground">{tr.reports.servicesPage.type}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.servicesPage.services}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.servicesPage.members}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeData.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: SERVICE_TYPE_COLORS[i % SERVICE_TYPE_COLORS.length] }} />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-2.5 px-3 font-bold">{row.services}</td>
                        <td className="text-right py-2.5 px-3 font-bold">{row.members.toLocaleString()}</td>
                      </tr>
                    ))}
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
