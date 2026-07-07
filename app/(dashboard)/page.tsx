"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, AreaChart, Area, ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Plus, UserCheck, TrendingUp, Heart, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useDashboardStats, useRegistrationTrends } from "@/lib/api/hooks"

const SEX_COLORS = ["#3b82f6", "#ec4899"]
const AGE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
const COMMUNITY_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"]

function cap(s: string | undefined) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: dashboardData, isLoading, error } = useDashboardStats()
  const { data: trendsData, isLoading: trendsLoading } = useRegistrationTrends(12)

  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const overview = dashboardData?.data?.overview
  const demographics = dashboardData?.data?.demographics
  const community = dashboardData?.data?.community

  const sexData = [
    { name: "Male", value: demographics?.sexDistribution?.male || 0 },
    { name: "Female", value: demographics?.sexDistribution?.female || 0 },
  ]
  const sexTotal = sexData.reduce((s, d) => s + d.value, 0)

  const ageData = (demographics?.ageGroupStats || []).map(s => ({
    name: cap(s.ageGroup),
    count: s.count,
  }))

  const communityData = (community?.subCommunityStats || []).map(s => ({
    name: cap(s.subCommunity),
    count: s.count,
  }))

  const trendData = (trendsData?.data?.trends || []).map(t => ({
    name: `${String(t.month).slice(0, 3)} ${t.year}`,
    registrations: t.count,
  }))

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">{tr.dashboard.failedToLoad}</h2>
            <p className="text-muted-foreground">{tr.dashboard.refreshPage}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{tr.dashboard.title}</h1>
          <p className="text-muted-foreground text-lg">
            {tr.dashboard.welcomeBack.replace("{name}", `${user?.firstName} ${user?.lastName}`)}
          </p>
        </div>
        <Link href="/members/new">
          <Button size="lg" className="gap-2 font-semibold">
            <Plus className="w-5 h-5" />
            {tr.dashboard.addMember}
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
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
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {tr.dashboard.totalMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary">{overview?.totalMembers ?? 0}</div>
                  <Users className="w-10 h-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {tr.dashboard.activeMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-green-500">{overview?.activeMembers ?? 0}</div>
                  <UserCheck className="w-10 h-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {tr.dashboard.newThisMonth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-blue-500">{overview?.newMembersThisMonth ?? 0}</div>
                  <TrendingUp className="w-10 h-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {tr.dashboard.maleFemale}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-purple-500">
                    {overview?.maleCount ?? 0} / {overview?.femaleCount ?? 0}
                  </div>
                  <Heart className="w-10 h-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row 1: Sex Distribution + Age Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.dashboard.sexDistribution}</CardTitle>
            <CardDescription>{tr.dashboard.maleFemaleBreakdown}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={sexData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sexData.map((_, i) => (
                        <Cell key={i} fill={SEX_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), tr.dashboard.members]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 flex-1">
                  {sexData.map((entry, i) => {
                    const pct = sexTotal > 0 ? Math.round((entry.value / sexTotal) * 100) : 0
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: SEX_COLORS[i] }} />
                          <span className="text-sm font-semibold">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.value.toLocaleString()}</div>
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

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.dashboard.ageGroups}</CardTitle>
            <CardDescription>{tr.dashboard.memberDistributionByAge}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ageData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), tr.dashboard.members]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ageData.map((_, i) => (
                      <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Sub-Communities + Monthly Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.dashboard.subCommunities}</CardTitle>
            <CardDescription>{tr.dashboard.membersPerCommunity}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={communityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), tr.dashboard.members]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {communityData.map((_, i) => (
                      <Cell key={i} fill={COMMUNITY_COLORS[i % COMMUNITY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{tr.dashboard.monthlyGrowth}</CardTitle>
            <CardDescription>{tr.dashboard.newRegistrationsLast12}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), tr.dashboard.newMembers]} />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#growthGradient)"
                    name={tr.dashboard.newRegistrations}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{tr.dashboard.quickActions}</CardTitle>
          <CardDescription>{tr.dashboard.commonTasks}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/members">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 font-semibold">
                <Users className="w-5 h-5" />
                {tr.dashboard.viewAllMembers}
              </Button>
            </Link>
            <Link href="/members/new">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 font-semibold">
                <Plus className="w-5 h-5" />
                {tr.dashboard.addNewMember}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
