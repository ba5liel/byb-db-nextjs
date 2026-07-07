"use client"

import Link from "next/link"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const SEX_COLORS = ["#3b82f6", "#ec4899"]
const AGE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
const MARITAL_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"]
const EDU_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#ec4899"]
const JOB_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

function cap(s: string | undefined) {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ''
}

function StatList({
  data,
  colors,
  valueKey = "count",
  labelKey = "name",
}: {
  data: Array<Record<string, unknown>>
  colors: string[]
  valueKey?: string
  labelKey?: string
}) {
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0)
  return (
    <div className="space-y-2 mt-2">
      {data.map((item, i) => {
        const val = Number(item[valueKey]) || 0
        const pct = total > 0 ? Math.round((val / total) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-sm font-medium truncate">{cap(String(item[labelKey]))}</span>
                <span className="text-sm font-bold ml-2">{val.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DemographicsReportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: dashboardData, isLoading } = useDashboardStats()
  const demographics = dashboardData?.data?.demographics

  const sexData = [
    { name: "Male", count: demographics?.sexDistribution?.male || 0 },
    { name: "Female", count: demographics?.sexDistribution?.female || 0 },
  ]
  const sexTotal = sexData.reduce((s, d) => s + d.count, 0)

  const ageData = (demographics?.ageGroupStats || []).map(s => ({
    name: cap(s.ageGroup),
    count: s.count,
    percentage: s.percentage,
  }))

  const maritalData = (demographics?.maritalStatusStats || []).map(s => ({
    name: cap(s.status),
    count: s.count,
    percentage: s.percentage,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.reports.demographicsPage.title}</h1>
          <p className="text-muted-foreground">{tr.reports.demographicsPage.subtitle}</p>
        </div>
      </div>

      {/* Sex Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.demographicsPage.sexDistribution}</CardTitle>
            <CardDescription>{tr.reports.demographicsPage.maleFemaleBreakdown}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={sexData} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="count">
                      {sexData.map((_, i) => <Cell key={i} fill={SEX_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 flex-1">
                  {sexData.map((entry, i) => {
                    const pct = sexTotal > 0 ? Math.round((entry.count / sexTotal) * 100) : 0
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: SEX_COLORS[i] }} />
                          <span className="text-sm font-semibold">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.count.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{pct}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age Groups Bar */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.demographicsPage.ageGroups}</CardTitle>
            <CardDescription>{tr.reports.demographicsPage.memberDistributionByAge}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ageData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <StatList data={ageData} colors={AGE_COLORS} valueKey="count" labelKey="name" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Marital Status + Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.demographicsPage.maritalStatus}</CardTitle>
            <CardDescription>Breakdown of marital status across members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : maritalData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="45%" height={180}>
                  <PieChart>
                    <Pie data={maritalData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="count">
                      {maritalData.map((_, i) => <Cell key={i} fill={MARITAL_COLORS[i % MARITAL_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Members"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1">
                  <StatList data={maritalData} colors={MARITAL_COLORS} valueKey="count" labelKey="name" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No marital status data available</p>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.reports.demographicsPage.educationLevel}</CardTitle>
            <CardDescription>Highest education level attained</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Education breakdown requires a dedicated analytics endpoint.{" "}
                <Link href="/members" className="text-primary font-semibold hover:underline">
                  Filter members by education →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
