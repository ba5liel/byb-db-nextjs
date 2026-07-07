"use client"

import Link from "next/link"
import { Users, BarChart3, Briefcase, MapPin, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

export default function ReportsPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const REPORT_CATEGORIES = [
    {
      href: "/reports/demographics",
      icon: Users,
      title: tr.reports.categories.demographics.title,
      description: tr.reports.categories.demographics.description,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      href: "/reports/members",
      icon: BarChart3,
      title: tr.reports.categories.memberDirectory.title,
      description: tr.reports.categories.memberDirectory.description,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      href: "/reports/services",
      icon: Briefcase,
      title: tr.reports.categories.servicesMinistry.title,
      description: tr.reports.categories.servicesMinistry.description,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      href: "/reports/communities",
      icon: MapPin,
      title: tr.reports.categories.communities.title,
      description: tr.reports.categories.communities.description,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      href: "/reports/financial",
      icon: DollarSign,
      title: tr.reports.categories.financialTithe.title,
      description: tr.reports.categories.financialTithe.description,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      href: "/reports/growth",
      icon: TrendingUp,
      title: tr.reports.categories.growthTrends.title,
      description: tr.reports.categories.growthTrends.description,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">{tr.reports.title}</h1>
        <p className="text-muted-foreground text-lg">
          {tr.reports.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href}>
            <Card variant="glass" hover="lift" className="h-full cursor-pointer">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${cat.bg}`}>
                  <cat.icon className={`w-6 h-6 ${cat.color}`} />
                </div>
                <CardTitle className="text-xl font-bold">{cat.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{cat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className={`text-sm font-semibold ${cat.color}`}>{tr.reports.viewReport}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
