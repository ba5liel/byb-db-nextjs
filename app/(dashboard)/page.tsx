"use client"

import { useEffect, useMemo, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Plus,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Baby,
  GraduationCap,
  Heart,
  UserMinus,
  HandHeart,
  VenusAndMars,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useDashboardStats, useServiceStats } from "@/lib/api/hooks"

const SUB_COMMUNITIES = [
  { id: "jemmo", label: "Jemmo" },
  { id: "bethel", label: "Bethel" },
  { id: "weyira", label: "Weyira" },
  { id: "alfa", label: "Alpha", aliases: ["alpha"] },
] as const

type SubCommunityStat = {
  subCommunity: string
  count: number
  male?: number
  female?: number
  baptized?: number
  children?: number
  childrenMale?: number
  childrenFemale?: number
  youth?: number
  youthMale?: number
  youthFemale?: number
  percentage: number
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_")
}

function findAgeCount(
  ageGroupStats: Array<{ ageGroup: string; count: number; male?: number; female?: number }> | undefined,
  keys: string[],
) {
  if (!ageGroupStats?.length) return { count: 0, male: 0, female: 0 }
  const keySet = new Set(keys.map(normalizeKey))
  return ageGroupStats.reduce(
    (acc, stat) => {
      if (!keySet.has(normalizeKey(stat.ageGroup))) return acc
      return {
        count: acc.count + (stat.count || 0),
        male: acc.male + (stat.male || 0),
        female: acc.female + (stat.female || 0),
      }
    },
    { count: 0, male: 0, female: 0 },
  )
}

function findMaritalCount(
  maritalStatusStats: Array<{ status: string; count: number }> | undefined,
  keys: string[],
) {
  if (!maritalStatusStats?.length) return 0
  const keySet = new Set(keys.map(normalizeKey))
  return maritalStatusStats.reduce((sum, stat) => {
    return keySet.has(normalizeKey(stat.status)) ? sum + (stat.count || 0) : sum
  }, 0)
}

function matchSubCommunity(
  stats: SubCommunityStat[] | undefined,
  id: string,
  aliases: readonly string[] = [],
) {
  const keys = new Set([id, ...aliases].map(normalizeKey))
  return stats?.find((stat) => keys.has(normalizeKey(stat.subCommunity)))
}

function StatPill({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/70 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
    </div>
  )
}

function MetricCard({
  title,
  children,
  icon: Icon,
}: {
  title: string
  children: ReactNode
  icon: typeof Users
}) {
  return (
    <Card variant="glass" hover="lift" className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground/40 shrink-0" />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { data: dashboardData, isLoading, error } = useDashboardStats()
  const { data: serviceData, isLoading: servicesLoading } = useServiceStats()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const overview = dashboardData?.data?.overview
  const demographics = dashboardData?.data?.demographics
  const community = dashboardData?.data?.community
  const totalServing = serviceData?.data?.totalServing ?? 0

  const ageBreakdown = useMemo(() => {
    const children = findAgeCount(demographics?.ageGroupStats, ["children"])
    const youth = findAgeCount(demographics?.ageGroupStats, ["youth", "teenagers"])
    const elder = findAgeCount(demographics?.ageGroupStats, ["seniors", "elder", "elders"])
    return { children, youth, elder }
  }, [demographics?.ageGroupStats])

  const marriedCount = findMaritalCount(demographics?.maritalStatusStats, ["married"])
  const unmarriedCount = findMaritalCount(demographics?.maritalStatusStats, ["unmarried", "single"])
  const leftMembers =
    overview?.leftMembers ??
    (overview?.inactiveMembers || 0) + (overview?.transferredMembers || 0)

  const maleCount = demographics?.sexDistribution.male ?? overview?.maleCount ?? 0
  const femaleCount = demographics?.sexDistribution.female ?? overview?.femaleCount ?? 0
  const genderTotal = maleCount + femaleCount
  const malePct = genderTotal > 0 ? Math.round((maleCount / genderTotal) * 100) : 0
  const femalePct = genderTotal > 0 ? 100 - malePct : 0

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Row 1: Total members, New this month, Add member */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-stretch">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 w-full md:w-44 rounded-xl" />
          </>
        ) : (
          <>
            <Card variant="glass" hover="lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary tabular-nums">
                    {overview?.totalMembers || 0}
                  </div>
                  <Users className="h-9 w-9 text-primary/25" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  New This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary tabular-nums">
                    {overview?.newMembersThisMonth || 0}
                  </div>
                  <TrendingUp className="h-9 w-9 text-primary/25" />
                </div>
              </CardContent>
            </Card>

            <Link href="/members/new" className="h-full">
              <Button
                size="lg"
                className="h-full w-full min-h-28 gap-2 px-8 text-base font-semibold"
              >
                <Plus className="h-5 w-5" />
                Add Member
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Row 2: Four sub-community containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : SUB_COMMUNITIES.map((group) => {
              const aliases = "aliases" in group ? group.aliases : []
              const stat = matchSubCommunity(
                community?.subCommunityStats as SubCommunityStat[] | undefined,
                group.id,
                aliases,
              )

              return (
                <Card key={group.id} variant="glass" hover="lift" className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl font-bold">{group.label}</CardTitle>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {stat?.count ?? 0} members
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label="Baptized" value={stat?.baptized ?? 0} />
                      <StatPill label="Men" value={stat?.male ?? 0} />
                      <StatPill label="Women" value={stat?.female ?? 0} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label="Children" value={stat?.children ?? 0} />
                      <StatPill label="Male" value={stat?.childrenMale ?? 0} />
                      <StatPill label="Female" value={stat?.childrenFemale ?? 0} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label="Youth" value={stat?.youth ?? 0} />
                      <StatPill label="Male" value={stat?.youthMale ?? 0} />
                      <StatPill label="Female" value={stat?.youthFemale ?? 0} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {/* Rows 3–4: Six insight containers (2 × 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading || servicesLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
        ) : (
          <>
            <MetricCard title="Demography" icon={VenusAndMars}>
              <div className="space-y-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="bg-blue-500" style={{ width: `${malePct}%` }} />
                  <div className="bg-pink-500" style={{ width: `${femalePct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/70 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">Male</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{maleCount}</p>
                    <p className="text-xs text-muted-foreground">{malePct}%</p>
                  </div>
                  <div className="rounded-lg bg-muted/70 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                      <span className="text-xs font-medium text-muted-foreground">Female</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{femaleCount}</p>
                    <p className="text-xs text-muted-foreground">{femalePct}%</p>
                  </div>
                </div>
              </div>
            </MetricCard>

            <MetricCard title="Age Distribution" icon={GraduationCap}>
              <div className="space-y-2">
                {[
                  { label: "Children", value: ageBreakdown.children.count, icon: Baby },
                  { label: "Youth", value: ageBreakdown.youth.count, icon: Users },
                  { label: "Elder", value: ageBreakdown.elder.count, icon: UserCheck },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-muted/70 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <row.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{row.label}</span>
                    </div>
                    <span className="text-xl font-bold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </MetricCard>

            <MetricCard title="Serving in Church" icon={HandHeart}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums text-primary">{totalServing}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Members currently serving
                  </p>
                </div>
                <HandHeart className="h-10 w-10 text-primary/20" />
              </div>
            </MetricCard>

            <MetricCard title="Married" icon={Heart}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums">{marriedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Married members</p>
                </div>
                <Heart className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </MetricCard>

            <MetricCard title="Unmarried" icon={Users}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums">{unmarriedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unmarried members</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </MetricCard>

            <MetricCard title="Left & Active" icon={UserMinus}>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Left
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-destructive/80">
                    {leftMembers}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Active
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-green-700 dark:text-green-400">
                    {overview?.activeMembers || 0}
                  </p>
                </div>
              </div>
            </MetricCard>
          </>
        )}
      </div>
    </div>
  )
}
