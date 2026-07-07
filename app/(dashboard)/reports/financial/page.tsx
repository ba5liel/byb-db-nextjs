"use client"

import Link from "next/link"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ArrowLeft, DollarSign, Users, TrendingUp, Percent } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinancialStats, useDashboardStats } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const FREQ_COLORS = ["#6366f1", "#10b981", "#f59e0b"]

function cap(s: string | undefined) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export default function FinancialReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: financialData, isLoading: finLoading } = useFinancialStats()
  const { data: dashboardData, isLoading: dashLoading } = useDashboardStats()
  const isLoading = finLoading || dashLoading

  const stats = financialData?.data
  const totalMembers = dashboardData?.data?.overview?.totalMembers || 0

  const titheStats = stats?.titheStats
  const nonPayers = totalMembers - (titheStats?.totalTithePayers || 0)
  const pct = totalMembers > 0 ? Math.round(((titheStats?.totalTithePayers || 0) / totalMembers) * 100) : 0

  const pieData = [
    { name: tr.reports.financialPage.payingTithe, value: titheStats?.totalTithePayers || 0 },
    { name: tr.reports.financialPage.notPaying, value: nonPayers > 0 ? nonPayers : 0 },
  ]
  const PIE_COLORS = ["#10b981", "#e5e7eb"]

  const freqData = (stats?.frequencyStats || []).map(f => ({
    name: cap(f.frequency),
    members: f.count,
    total: f.totalAmount,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.financialPage.title}</h1>
          <p className="text-muted-foreground">{tr.reports.financialPage.subtitle}</p>
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
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.financialPage.tithePayers}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-emerald-500">
                    {titheStats?.totalTithePayers?.toLocaleString() ?? 0}
                  </div>
                  <Users className="w-10 h-10 text-emerald-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.financialPage.participationRate}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-blue-500">{pct}%</div>
                  <Percent className="w-10 h-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.financialPage.monthlyTotal}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-purple-500">
                    {titheStats?.totalMonthlyTithe?.toLocaleString() ?? 0}
                  </div>
                  <DollarSign className="w-10 h-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{tr.reports.financialPage.avgPerPayerBirr}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-orange-500">
                    {titheStats?.averageTithe?.toLocaleString() ?? 0}
                  </div>
                  <TrendingUp className="w-10 h-10 text-orange-500/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Participation Pie + Frequency Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.financialPage.participationBreakdown}</CardTitle>
            <CardDescription>{tr.reports.financialPage.titheVsNonPayers}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 flex-1">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-sm font-semibold">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalMembers > 0 ? Math.round((entry.value / totalMembers) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.financialPage.paymentFrequency}</CardTitle>
            <CardDescription>{tr.reports.financialPage.howOftenPaid}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : freqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={freqData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                  <Bar dataKey="members" radius={[4, 4, 0, 0]}>
                    {freqData.map((_, i) => <Cell key={i} fill={FREQ_COLORS[i % FREQ_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{tr.reports.servicesPage.noFrequencyData}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Frequency detail table */}
      {freqData.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.financialPage.frequencyDetails}</CardTitle>
            <CardDescription>{tr.reports.financialPage.memberCountAndContribution}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 font-bold text-muted-foreground">{tr.reports.financialPage.frequency}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.financialPage.members}</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">{tr.reports.financialPage.totalAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freqData.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: FREQ_COLORS[i % FREQ_COLORS.length] }} />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-2.5 px-3 font-bold">{row.members.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-3 font-bold">{row.total.toLocaleString()} {tr.reports.financialPage.birr}</td>
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
