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
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const SUB_COMMUNITY_IDS = [
  { id: "jemmo", key: "jemmo" as const },
  { id: "bethel", key: "bethel" as const },
  { id: "weyira", key: "weyira" as const },
  { id: "alpha", key: "alpha" as const, aliases: ["alfa"] },
] as const

type SubCommunityStat = {
  subCommunity?: string
  _id?: string
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
  percentage?: number
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "_")
}

function findAgeCount(
  ageGroupStats:
    | Array<{
        ageGroup?: string
        _id?: string
        count: number
        male?: number
        female?: number
      }>
    | undefined,
  keys: string[],
) {
  if (!ageGroupStats?.length) return { count: 0, male: 0, female: 0 }
  const keySet = new Set(keys.map(normalizeKey))
  return ageGroupStats.reduce(
    (acc, stat) => {
      const key = normalizeKey(stat.ageGroup ?? stat._id)
      if (!keySet.has(key)) return acc
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
  maritalStatusStats:
    | Array<{ status?: string; _id?: string; count: number }>
    | undefined,
  keys: string[],
) {
  if (!maritalStatusStats?.length) return 0
  const keySet = new Set(keys.map(normalizeKey))
  return maritalStatusStats.reduce((sum, stat) => {
    const key = normalizeKey(stat.status ?? stat._id)
    return keySet.has(key) ? sum + (stat.count || 0) : sum
  }, 0)
}

function matchSubCommunity(
  stats: SubCommunityStat[] | undefined,
  id: string,
  aliases: readonly string[] = [],
) {
  const keys = new Set([id, ...aliases].map(normalizeKey))
  return stats?.find((stat) =>
    keys.has(normalizeKey(stat.subCommunity ?? stat._id)),
  )
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
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const d = t.dashboard
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
    const teenagers = findAgeCount(demographics?.ageGroupStats, ["teenagers", "teen", "teens"])
    const youth = findAgeCount(demographics?.ageGroupStats, ["youth"])
    const adults = findAgeCount(demographics?.ageGroupStats, ["adults", "adult"])
    const seniors = findAgeCount(demographics?.ageGroupStats, ["seniors", "senior", "elder", "elders"])
    const unknown = findAgeCount(demographics?.ageGroupStats, ["unknown", "unspecified"])
    return { children, teenagers, youth, adults, seniors, unknown }
  }, [demographics?.ageGroupStats])

  const totalMembers = overview?.totalMembers || 0
  const marriedCount = findMaritalCount(demographics?.maritalStatusStats, ["married"])
  // Married is authoritative; unmarried is the remainder of total members
  const unmarriedCount = Math.max(0, totalMembers - marriedCount)
  const leftMembers =
    overview?.leftMembers ??
    (overview?.inactiveMembers || 0) + (overview?.transferredMembers || 0)

  const maleCount = demographics?.sexDistribution.male ?? overview?.maleCount ?? 0
  const femaleCount = demographics?.sexDistribution.female ?? overview?.femaleCount ?? 0
  const genderTotal = maleCount + femaleCount
  const malePct = genderTotal > 0 ? Math.round((maleCount / genderTotal) * 100) : 0
  const femalePct = genderTotal > 0 ? 100 - malePct : 0

  const welcomeText = d.welcomeBack.replace("{name}", user?.name || "")

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">{d.failedTitle}</h2>
            <p className="text-muted-foreground">{d.failedHint}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
        <p className="text-muted-foreground mt-1">{welcomeText}</p>
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
                  {d.totalMembers}
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
                  {d.newThisMonth}
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
                {d.addMember}
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Row 2: Four sub-community containers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : SUB_COMMUNITY_IDS.map((group) => {
              const aliases = "aliases" in group ? group.aliases : []
              const label =
                group.key === "alpha"
                  ? t.navigation.alpha
                  : t.navigation[group.key]
              const stat = matchSubCommunity(
                community?.subCommunityStats as SubCommunityStat[] | undefined,
                group.id,
                aliases,
              )

              return (
                <Card key={group.id} variant="glass" hover="lift" className="overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl font-bold">{label}</CardTitle>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {stat?.count ?? 0} {d.members}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label={d.baptized} value={stat?.baptized ?? 0} />
                      <StatPill label={d.men} value={stat?.male ?? 0} />
                      <StatPill label={d.women} value={stat?.female ?? 0} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label={d.children} value={stat?.children ?? 0} />
                      <StatPill label={d.male} value={stat?.childrenMale ?? 0} />
                      <StatPill label={d.female} value={stat?.childrenFemale ?? 0} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatPill label={d.youth} value={stat?.youth ?? 0} />
                      <StatPill label={d.male} value={stat?.youthMale ?? 0} />
                      <StatPill label={d.female} value={stat?.youthFemale ?? 0} />
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
            <MetricCard title={d.demography} icon={VenusAndMars}>
              <div className="space-y-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="bg-blue-500" style={{ width: `${malePct}%` }} />
                  <div className="bg-pink-500" style={{ width: `${femalePct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/70 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">{d.male}</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{maleCount}</p>
                    <p className="text-xs text-muted-foreground">{malePct}%</p>
                  </div>
                  <div className="rounded-lg bg-muted/70 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                      <span className="text-xs font-medium text-muted-foreground">{d.female}</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{femaleCount}</p>
                    <p className="text-xs text-muted-foreground">{femalePct}%</p>
                  </div>
                </div>
              </div>
            </MetricCard>

            <MetricCard title={d.ageDistribution} icon={GraduationCap}>
              <div className="space-y-2">
                {[
                  { label: d.childBand, value: ageBreakdown.children.count, icon: Baby },
                  { label: d.teenBand, value: ageBreakdown.teenagers.count, icon: Users },
                  { label: d.youthBand, value: ageBreakdown.youth.count, icon: Users },
                  { label: d.adultBand, value: ageBreakdown.adults.count, icon: UserCheck },
                  { label: d.seniorBand, value: ageBreakdown.seniors.count, icon: UserCheck },
                  ...(ageBreakdown.unknown.count > 0
                    ? [{ label: d.unknownDob, value: ageBreakdown.unknown.count, icon: AlertCircle }]
                    : []),
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
                <div className="flex items-center justify-between border-t border-border/60 pt-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {d.total}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {ageBreakdown.children.count +
                      ageBreakdown.teenagers.count +
                      ageBreakdown.youth.count +
                      ageBreakdown.adults.count +
                      ageBreakdown.seniors.count +
                      ageBreakdown.unknown.count}
                    {" / "}
                    {totalMembers}
                  </span>
                </div>
              </div>
            </MetricCard>

            <MetricCard title={d.servingInChurch} icon={HandHeart}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums text-primary">{totalServing}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {d.currentlyServing}
                  </p>
                </div>
                <HandHeart className="h-10 w-10 text-primary/20" />
              </div>
            </MetricCard>

            <MetricCard title={d.married} icon={Heart}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums">{marriedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">{d.marriedMembers}</p>
                </div>
                <Heart className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </MetricCard>

            <MetricCard title={d.unmarried} icon={Users}>
              <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                  <p className="text-4xl font-bold tabular-nums">{unmarriedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {d.notMarkedMarried}
                  </p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </MetricCard>

            <MetricCard title={d.leftAndActive} icon={UserMinus}>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    {d.left}
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-destructive/80">
                    {leftMembers}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    {d.active}
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
