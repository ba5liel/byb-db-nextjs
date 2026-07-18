"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertCircle,
  Heart,
  Home,
  TrendingUp,
  UserCheck,
  Users,
  Users2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  useDashboardStats,
  useRegistrationTrends,
  useServiceStats,
} from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#0f766e",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#4d7c0f",
]

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: number | string
  icon: typeof Users
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{value}</div>
            {hint ? (
              <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            ) : null}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
  empty,
}: {
  title: string
  description: string
  children: ReactNode
  empty?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            No data available yet
          </p>
        ) : (
          <div className="h-[320px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { locale } = useLanguage()
  const am = locale === "am"

  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboardStats()
  const {
    data: trendsResponse,
    isLoading: trendsLoading,
  } = useRegistrationTrends(12)
  const {
    data: serviceResponse,
    isLoading: servicesLoading,
  } = useServiceStats()

  const stats = dashboardResponse?.data
  const overview = stats?.overview
  const demographics = stats?.demographics
  const community = stats?.community
  const trends = trendsResponse?.data
  const services = serviceResponse?.data

  const sexData = [
    { name: am ? "ወንድ" : "Male", value: overview?.maleCount || 0 },
    { name: am ? "ሴት" : "Female", value: overview?.femaleCount || 0 },
  ].filter((item) => item.value > 0)

  const ageData = (demographics?.ageGroupStats || []).map((item) => ({
    name: titleCase(item.ageGroup),
    value: item.count,
    percentage: item.percentage,
  }))

  const maritalData = (demographics?.maritalStatusStats || []).map((item) => ({
    name: titleCase(item.status),
    value: item.count,
    percentage: item.percentage,
  }))

  const subCommunityData = (community?.subCommunityStats || []).map((item) => ({
    name: titleCase(item.subCommunity),
    count: item.count,
    male: item.male || 0,
    female: item.female || 0,
  }))

  const seferData = (community?.seferStats || []).map((item) => ({
    name: item.sefer,
    count: item.count,
    male: item.male || 0,
    female: item.female || 0,
  }))

  const groupTypeData = (community?.groupTypeStats || []).map((item) => ({
    name: titleCase(item.groupType),
    count: item.count,
  }))

  const trendData = (trends?.trends || []).map((item) => ({
    label: `${item.month} ${item.year}`,
    count: item.count,
    cumulative: item.cumulativeCount,
  }))

  const serviceData = (services?.topServices || services?.serviceStats || []).map(
    (item: any) => ({
      name: item.serviceName || item.type || "Unknown",
      count: item.memberCount ?? item.count ?? 0,
    }),
  )

  const isLoading = dashboardLoading || trendsLoading || servicesLoading

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">
              {am ? "ትንታኔ ማምጣት አልተቻለም" : "Failed to load analytics"}
            </h2>
            <p className="text-muted-foreground">
              {am ? "ገጹን እንደገና ይሞክሩ" : "Please refresh the page and try again"}
            </p>
            <Button asChild>
              <Link href="/analytics">Retry</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {am ? "ትንታኔ" : "Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {am
              ? "የቤተክርስቲያን አባላት፣ ቤተሰቦች፣ ሰፈሮች እና አገልግሎት ስታቲስቲክስ"
              : "Church-wide member, family, sefer, and ministry statistics"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/members">View members</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label={am ? "ጠቅላላ አባላት" : "Total Members"}
              value={overview?.totalMembers || 0}
              icon={Users}
            />
            <StatCard
              label={am ? "ንቁ አባላት" : "Active Members"}
              value={overview?.activeMembers || 0}
              icon={UserCheck}
              hint={`${overview?.inactiveMembers || 0} inactive`}
            />
            <StatCard
              label={am ? "ቤተሰቦች" : "Total Families"}
              value={overview?.totalFamilies || 0}
              icon={Home}
            />
            <StatCard
              label={am ? "አዲስ በዚህ ወር" : "New This Month"}
              value={overview?.newMembersThisMonth || 0}
              icon={TrendingUp}
            />
            <StatCard
              label={am ? "ወንድ / ሴት" : "Male / Female"}
              value={`${overview?.maleCount || 0} / ${overview?.femaleCount || 0}`}
              icon={Users2}
            />
            <StatCard
              label={am ? "ጥምቀት የተቀበሉ" : "Baptized"}
              value={overview?.baptizedMembers || 0}
              icon={Heart}
            />
            <StatCard
              label={am ? "በማስተላለፍ" : "Transferred In"}
              value={overview?.transferredMembers || 0}
              icon={Users}
            />
            <StatCard
              label={am ? "አስራት ከፋዮች" : "Tithe Payers"}
              value={overview?.tithePayersCount || 0}
              icon={Heart}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title={am ? "የእድሜ ቡድን" : "Age Group Distribution"}
          description={am ? "የአባላት እድሜ ቡድን ክፍፍል" : "Share of members by age group"}
          empty={!isLoading && ageData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
              >
                {ageData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item: any) => [
                  `${value} (${item?.payload?.percentage ?? 0}%)`,
                  item?.payload?.name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "ጾታ ክፍፍል" : "Gender Distribution"}
          description={am ? "ወንድ እና ሴት አባላት" : "Male vs female members"}
          empty={!isLoading && sexData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sexData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
              >
                {sexData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "የሰፈር ስርጭት" : "Sefer Distribution"}
          description={
            am ? "አባላት በሰፈር" : "Members by neighborhood / sefer"
          }
          empty={!isLoading && seferData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seferData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "የቤተክርስቲያን ቡድን" : "Church Group Distribution"}
          description={
            am ? "Jemmo / Bethel / Weyira / Alpha" : "Members by church group"
          }
          empty={!isLoading && subCommunityData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subCommunityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="male" stackId="a" fill={CHART_COLORS[0]} name={am ? "ወንድ" : "Male"} />
              <Bar dataKey="female" stackId="a" fill={CHART_COLORS[1]} name={am ? "ሴት" : "Female"} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "የጋብቻ ሁኔታ" : "Marital Status"}
          description={am ? "የአባላት የጋብቻ ሁኔታ" : "Members by marital status"}
          empty={!isLoading && maritalData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={maritalData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
              >
                {maritalData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "የቡድን አይነት" : "Group Types"}
          description={
            am ? "ሴል፣ ወጣቶች፣ ጸሎት፣ ወዘተ" : "Cell groups, youth groups, and more"
          }
          empty={!isLoading && groupTypeData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupTypeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "የምዝገባ አዝማሚያ" : "Registration Trends"}
          description={
            am ? "ባለፉት 12 ወራት" : "New member registrations over the last 12 months"
          }
          empty={!isLoading && trendData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name={am ? "አዲስ" : "New"}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name={am ? "ድምር" : "Cumulative"}
                stroke={CHART_COLORS[3]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={am ? "አገልግሎት ተሳትፎ" : "Service Participation"}
          description={
            am
              ? "አባላት በአገልግሎት"
              : "Members currently serving by ministry"
          }
          empty={!isLoading && serviceData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {am ? "የቡድን ማጠቃለያ" : "Group Type Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupTypeData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No group data yet</p>
            ) : (
              groupTypeData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {am ? "አገልግሎት ማጠቃለያ" : "Service Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{am ? "በአገልግሎት ላይ" : "Currently serving"}</span>
              <span className="tabular-nums">{services?.totalServing || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{am ? "አገልግሎቶች" : "Distinct services"}</span>
              <span className="tabular-nums">{services?.totalServices || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{am ? "ማገልገል የሚፈልጉ" : "Wanting to serve"}</span>
              <span className="tabular-nums">{services?.wantingToServe || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
