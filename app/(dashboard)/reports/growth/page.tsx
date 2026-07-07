"use client"

import Link from "next/link"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { ArrowLeft, TrendingUp, Users, Calendar, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRegistrationTrends, useDashboardStats } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

export default function GrowthReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: trendsData, isLoading: trendsLoading } = useRegistrationTrends(12)
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats()
  const isLoading = trendsLoading || dashLoading

  const trends = trendsData?.data?.trends || []
  const avgPerMonth = trendsData?.data?.averagePerMonth || 0
  const totalRegs = trendsData?.data?.totalRegistrations || 0
  const totalMembers = dashboardData?.data?.overview?.totalMembers || 0
  const newThisMonth = dashboardData?.data?.overview?.newMembersThisMonth || 0

  const areaData = trends.map(t => ({
    name: `${String(t.month).slice(0, 3)} ${t.year}`,
    registrations: t.count,
    cumulative: t.cumulativeCount,
  }))

  const barData = trends.map(t => ({
    name: `${String(t.month).slice(0, 3)}`,
    count: t.count,
  }))

  // Month-over-month change for last 2 months
  const lastTwo = trends.slice(-2)
  const momChange = lastTwo.length === 2 ? lastTwo[1].count - lastTwo[0].count : null
  const momPct = lastTwo.length === 2 && lastTwo[0].count > 0
    ? ((momChange! / lastTwo[0].count) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.growthPage.title}</h1>
          <p className="text-muted-foreground">{tr.reports.growthPage.subtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}
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
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.growthPage.totalMembers}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary">{totalMembers.toLocaleString()}</div>
                  <Users className="w-10 h-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.growthPage.newThisMonth}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-blue-500">{newThisMonth}</div>
                  <Calendar className="w-10 h-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.growthPage.totalRegistrations}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-purple-500">{totalRegs.toLocaleString()}</div>
                  <TrendingUp className="w-10 h-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.growthPage.avgPerMonth}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-emerald-500">{avgPerMonth.toFixed(0)}</div>
                  <ArrowUpRight className="w-10 h-10 text-emerald-500/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Area chart: cumulative */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{tr.reports.growthPage.cumulativeGrowth}</CardTitle>
          <CardDescription>{tr.reports.growthPage.cumulativeMembers}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Total Members"]} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#cumulativeGradient)"
                  name="Total Members"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar chart: monthly new */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.growthPage.monthlyRegistrations}</CardTitle>
            <CardDescription>{tr.reports.growthPage.newMembers}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), "New Members"]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Month-over-Month</CardTitle>
            <CardDescription>Recent trend details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-3 mt-2">
                {momChange !== null && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${momChange >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    <ArrowUpRight className={`w-8 h-8 ${momChange >= 0 ? "text-emerald-500" : "text-red-500 rotate-90"}`} />
                    <div>
                      <div className={`text-2xl font-bold ${momChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {momChange >= 0 ? "+" : ""}{momChange} members
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {momPct !== null ? `${momPct}% vs previous month` : "vs previous month"}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 pt-2">
                  {trends.slice(-6).reverse().map((t, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">{String(t.month).slice(0, 3)} {t.year}</span>
                      <span className="font-bold">{t.count.toLocaleString()} new</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
