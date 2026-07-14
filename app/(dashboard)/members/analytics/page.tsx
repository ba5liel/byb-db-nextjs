"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Users, UserCheck, UserX, UserPlus, User, Users2 } from "lucide-react"
import { useMembers } from "@/lib/members-context"
import type { Member } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"

/** A single label/count row inside a breakdown card. */
interface BreakdownRow {
  label: string
  count: number
}

function BreakdownCard({
  title,
  rows,
  emptyLabel,
}: {
  title: string
  rows: BreakdownRow[]
  emptyLabel: string
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          rows.map((row) => {
            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.count}
                    <span className="ml-1.5 text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: typeof Users
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${accent}`} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function MemberAnalyticsPage() {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { members, loading } = useMembers()
  const am = locale === "am"

  const stats = useMemo(() => {
    const now = new Date()
    const count = (pred: (m: Member) => boolean) => members.filter(pred).length

    const inMonth = (dateStr?: string) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }

    const groupBy = (
      keyFn: (m: Member) => string | undefined,
      order: string[],
      labelFn: (key: string) => string,
    ): BreakdownRow[] => {
      const counts = new Map<string, number>()
      for (const m of members) {
        const key = keyFn(m)
        if (!key) continue
        counts.set(key, (counts.get(key) || 0) + 1)
      }
      const seen = new Set(order)
      const rows: BreakdownRow[] = order
        .filter((k) => counts.has(k))
        .map((k) => ({ label: labelFn(k), count: counts.get(k) || 0 }))
      // Include any keys not in the predefined order (defensive).
      for (const [k, v] of counts) {
        if (!seen.has(k)) rows.push({ label: labelFn(k), count: v })
      }
      return rows
    }

    return {
      total: members.length,
      active: count((m) => m.membershipStatus === "Active"),
      inactive: count((m) => m.membershipStatus === "Inactive"),
      male: count((m) => m.gender === "Male"),
      female: count((m) => m.gender === "Female"),
      newThisMonth: count((m) => inMonth(m.registrationDate || m.joinDate)),
      byGroup: groupBy(
        (m) => m.subCommunity,
        ["Jemmo", "Bethel", "Weyira", "Alpha"],
        (k) =>
          k === "Jemmo"
            ? t.members.jemmo
            : k === "Bethel"
              ? t.members.bethel
              : k === "Weyira"
                ? t.members.weyira
                : k === "Alpha"
                  ? t.members.alfa
                  : k,
      ),
      byAgeGroup: groupBy(
        (m) => m.ageGroup,
        ["Children", "Teenagers", "Youth", "Adults", "Seniors"],
        (k) =>
          k === "Children"
            ? t.members.children
            : k === "Teenagers"
              ? t.members.teenagers
              : k === "Youth"
                ? t.members.youth
                : k === "Adults"
                  ? t.members.adults
                  : k === "Seniors"
                    ? t.members.seniors
                    : k,
      ),
      byDiscipleship: groupBy(
        (m) => m.catechesisStatus,
        ["Not Started", "In Progress", "Completed"],
        (k) =>
          k === "Not Started"
            ? am
              ? "አልተጀመረም"
              : "Not Started"
            : k === "In Progress"
              ? am
                ? "በሂደት ላይ"
                : "In Progress"
              : k === "Completed"
                ? am
                  ? "ተጠናቋል"
                  : "Completed"
                : k,
      ),
      byTithe: groupBy(
        (m) => m.paysTithe,
        ["yes", "no", "unknown"],
        (k) =>
          k === "yes"
            ? am
              ? "አዎ"
              : "Pays tithe"
            : k === "no"
              ? am
                ? "አይ"
                : "Does not pay"
              : am
                ? "አይታወቅም"
                : "Unknown",
      ),
    }
  }, [members, t, am])

  const emptyLabel = am ? "ምንም መረጃ የለም" : "No data"

  return (
    <PermissionGuard resource={Resource.CHURCH_MEMBER} action={Action.READ}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {am ? "ወደ አባላት ተመለስ" : "Back to Members"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {am ? "የአባላት ትንታኔ" : "Member Analytics"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {am
              ? "የአባላት ስብጥር እና አዝማሚያዎች አጠቃላይ እይታ"
              : "An overview of your membership composition and trends"}
          </p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label={t.members.totalMembers} value={stats.total} icon={Users} accent="text-primary" />
            <StatCard
              label={t.members.activeMembers}
              value={stats.active}
              icon={UserCheck}
              accent="text-green-600"
            />
            <StatCard
              label={t.members.inactiveMembers}
              value={stats.inactive}
              icon={UserX}
              accent="text-amber-600"
            />
            <StatCard
              label={am ? "በዚህ ወር አዲስ" : "New This Month"}
              value={stats.newThisMonth}
              icon={UserPlus}
              accent="text-primary"
            />
            <StatCard label={t.members.male} value={stats.male} icon={User} accent="text-blue-600" />
            <StatCard
              label={t.members.female}
              value={stats.female}
              icon={Users2}
              accent="text-pink-600"
            />
          </div>
        )}

        {/* Breakdowns */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownCard
              title={am ? "በቤተክርስቲያን ቡድን" : "By Church Group"}
              rows={stats.byGroup}
              emptyLabel={emptyLabel}
            />
            <BreakdownCard
              title={am ? "በእድሜ ክፍል" : "By Age Group"}
              rows={stats.byAgeGroup}
              emptyLabel={emptyLabel}
            />
            <BreakdownCard
              title={am ? "በደቀ መዝሙርነት ሁኔታ" : "By Discipleship Status"}
              rows={stats.byDiscipleship}
              emptyLabel={emptyLabel}
            />
            <BreakdownCard
              title={am ? "በአስራት" : "By Tithe"}
              rows={stats.byTithe}
              emptyLabel={emptyLabel}
            />
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
