"use client"

import Link from "next/link"
import { Network, Users, Grid3x3, ChevronRight, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/lib/api/hooks"
import { useCellGroups } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

const COMMUNITIES = [
  { key: "jemmo",  label: "Jemmo",  abbr: "JM", color: "from-violet-500/20 to-violet-500/5",  ring: "ring-violet-500/30" },
  { key: "bethel", label: "Bethel", abbr: "BT", color: "from-blue-500/20 to-blue-500/5",    ring: "ring-blue-500/30" },
  { key: "weyira", label: "Weyira", abbr: "WY", color: "from-cyan-500/20 to-cyan-500/5",    ring: "ring-cyan-500/30" },
  { key: "alfa",   label: "Alfa",   abbr: "AL", color: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-500/30" },
] as const

export default function SubCommunitiesPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats()
  const { data: cellGroupsData, isLoading: cgLoading } = useCellGroups({ limit: 200 })

  const subCommunityStats = dashboardData?.data?.community?.subCommunityStats ?? []
  const cellGroups = cellGroupsData?.data ?? []
  const totalMembers = dashboardData?.data?.overview?.totalMembers ?? 0

  function getMemberCount(community: string) {
    return subCommunityStats.find(s => s.subCommunity === community)?.count ?? 0
  }

  function getCellGroupCount(community: string) {
    return (Array.isArray(cellGroups) ? cellGroups : []).filter(cg => cg.subCommunity === community && cg.isActive).length
  }

  const isLoading = statsLoading || cgLoading

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.subCommunities.title}</h1>
          <p className="text-muted-foreground">
            {isLoading ? tr.subCommunities.loading : tr.subCommunities.totalMembersAcross.replace("{total}", totalMembers.toLocaleString())}
          </p>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.communities}</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.members}</p>
                {isLoading ? <Skeleton className="h-7 w-16 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.cellGroupsLabel}</p>
                {isLoading ? <Skeleton className="h-7 w-12 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{(Array.isArray(cellGroups) ? cellGroups : []).filter(cg => cg.isActive).length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{tr.subCommunities.avgPerCommunity}</p>
                {isLoading ? <Skeleton className="h-7 w-14 mt-0.5" /> : (
                  <p className="text-2xl font-bold">{totalMembers > 0 ? Math.round(totalMembers / 4).toLocaleString() : "—"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {COMMUNITIES.map(({ key, label, abbr, color, ring }) => {
          const memberCount = getMemberCount(key)
          const cellGroupCount = getCellGroupCount(key)
          const pct = totalMembers > 0 ? Math.round((memberCount / totalMembers) * 100) : 0

          return (
            <Link key={key} href={`/sub-communities/${key}`}>
              <Card
                variant="glass"
                hover="lift"
                className={`cursor-pointer ring-1 ${ring} overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} pointer-events-none`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                        <span className="text-xl font-black tracking-tight">{abbr}</span>
                      </div>
                      <h2 className="text-2xl font-bold">{label}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5 capitalize">{key} community</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        {isLoading ? <Skeleton className="h-8 w-16" /> : (
                          <p className="text-3xl font-bold">{memberCount.toLocaleString()}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold uppercase tracking-wide">{tr.subCommunities.members}</p>
                      </div>
                      <div>
                        {cgLoading ? <Skeleton className="h-8 w-12" /> : (
                          <p className="text-3xl font-bold">{cellGroupCount}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold uppercase tracking-wide">{tr.subCommunities.cellGroupsLabel}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>{tr.subCommunities.shareOfTotal}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
