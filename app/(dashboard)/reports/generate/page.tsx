"use client"

import { useMemo, useState } from "react"
import { FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMembers } from "@/lib/members-context"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getTranslation } from "@/lib/translations"
import { subCommunityForRole } from "@/lib/role-utils"
import type { Member, SubCommunity } from "@/lib/types"

type MetricKey =
  | "total"
  | "active"
  | "left"
  | "male"
  | "female"
  | "children"
  | "youth"
  | "teenagers"
  | "adults"
  | "seniors"
  | "married"
  | "unmarried"
  | "baptized"
  | "serving"
  | "newInRange"

const ALL_METRICS: { key: MetricKey; en: string; am: string }[] = [
  { key: "total", en: "Total members", am: "Total members" },
  { key: "active", en: "Active", am: "Active" },
  { key: "left", en: "Left", am: "Left" },
  { key: "male", en: "Male", am: "Male" },
  { key: "female", en: "Female", am: "Female" },
  { key: "children", en: "Children", am: "Children" },
  { key: "teenagers", en: "Teenagers", am: "Teenagers" },
  { key: "youth", en: "Youth", am: "Youth" },
  { key: "adults", en: "Adults", am: "Adults" },
  { key: "seniors", en: "Seniors", am: "Seniors" },
  { key: "married", en: "Married", am: "Married" },
  { key: "unmarried", en: "Unmarried", am: "Unmarried" },
  { key: "baptized", en: "Baptized", am: "Baptized" },
  { key: "serving", en: "Serving", am: "Serving" },
  { key: "newInRange", en: "Joined in date range", am: "Joined in date range" },
]

const COMMUNITIES: SubCommunity[] = ["Jemmo", "Bethel", "Weyira", "Alpha"]

function memberDisplayName(m: Member) {
  return (
    m.fullName ||
    [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") ||
    "-"
  )
}

function parseDay(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + "T00:00:00")
  return Number.isNaN(d.getTime()) ? null : d
}

function endOfDay(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + "T23:59:59.999")
  return Number.isNaN(d.getTime()) ? null : d
}

function joinDateOf(m: Member): Date | null {
  const raw = m.joinDate || m.registrationDate || m.createdAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function communityMatches(m: Member, community: string, scoped?: string) {
  if (scoped) {
    const label = scoped.charAt(0).toUpperCase() + scoped.slice(1)
    return m.subCommunity === label || m.subCommunity?.toLowerCase() === scoped
  }
  if (community === "all") return true
  return m.subCommunity === community
}

function computeMetrics(members: Member[]) {
  return {
    total: members.length,
    active: members.filter((m) => m.membershipStatus === "Active").length,
    left: members.filter((m) => m.membershipStatus !== "Active").length,
    male: members.filter((m) => m.gender === "Male").length,
    female: members.filter((m) => m.gender === "Female").length,
    children: members.filter((m) => m.ageGroup === "Children").length,
    teenagers: members.filter((m) => m.ageGroup === "Teenagers").length,
    youth: members.filter((m) => m.ageGroup === "Youth").length,
    adults: members.filter((m) => m.ageGroup === "Adults").length,
    seniors: members.filter((m) => m.ageGroup === "Seniors").length,
    married: members.filter((m) => m.maritalStatus === "Married").length,
    unmarried: members.filter((m) => m.maritalStatus !== "Married").length,
    baptized: members.filter((m) => Boolean(m.baptismYearEthiopian?.trim())).length,
    serving: members.filter((m) => (m.currentServices?.length ?? 0) > 0).length,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export default function GenerateReportPage() {
  const { members, loading } = useMembers()
  const { locale } = useLanguage()
  const { user } = useAuth()
  const t = getTranslation(locale)
  const en = locale !== "am"
  const scopedCommunity = subCommunityForRole(user?.role)

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [community, setCommunity] = useState<string>("all")
  const [includeNames, setIncludeNames] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    "total",
    "active",
    "left",
    "male",
    "female",
    "children",
    "youth",
    "married",
    "unmarried",
  ])
  const [generated, setGenerated] = useState(false)

  const filtered = useMemo(() => {
    const from = parseDay(fromDate)
    const to = endOfDay(toDate)
    return members.filter((m) => {
      if (!communityMatches(m, community, scopedCommunity)) return false
      const joined = joinDateOf(m)
      if (from && (!joined || joined < from)) return false
      if (to && (!joined || joined > to)) return false
      return true
    })
  }, [members, fromDate, toDate, community, scopedCommunity])

  const metrics = useMemo(() => {
    const base = computeMetrics(filtered)
    return { ...base, newInRange: filtered.length }
  }, [filtered])

  const metricLabels = useMemo(() => {
    const d = t.dashboard
    const m = t.members
    return new Map<MetricKey, string>([
      ["total", d.totalMembers],
      ["active", d.active],
      ["left", d.left],
      ["male", d.male],
      ["female", d.female],
      ["children", d.children],
      ["teenagers", m.teenagers],
      ["youth", d.youth],
      ["adults", m.adults],
      ["seniors", m.seniors],
      ["married", d.married],
      ["unmarried", d.unmarried],
      ["baptized", d.baptized],
      ["serving", d.currentlyServing],
      ["newInRange", en ? "Joined in date range" : "በቀን ክልል የተመዘገቡ"],
    ])
  }, [t, en])

  function toggleMetric(key: MetricKey, on: boolean) {
    setSelectedMetrics((prev) =>
      on ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((k) => k !== key),
    )
  }

  function printReport() {
    const rows = selectedMetrics
      .map((key) => {
        const label = metricLabels.get(key) || key
        return `<tr><td>${escapeHtml(label)}</td><td style="text-align:right;font-weight:700">${metrics[key]}</td></tr>`
      })
      .join("")

    const namesBlock =
      includeNames && filtered.length > 0
        ? `<h2 style="margin:24px 0 8px;font-size:16px">${en ? "Member names" : "Names"} (${filtered.length})</h2>
           <ol style="columns:2;font-size:12px;line-height:1.6;padding-left:18px">
             ${filtered.map((m) => `<li>${escapeHtml(memberDisplayName(m))}</li>`).join("")}
           </ol>`
        : ""

    const rangeLabel =
      fromDate || toDate
        ? `${fromDate || "..."} -> ${toDate || "..."}`
        : en
          ? "All dates"
          : "All dates"

    const communityLabel = scopedCommunity
      ? scopedCommunity
      : community === "all"
        ? en
          ? "All sub-communities"
          : "All sub-communities"
        : community

    const title = en ? "Church Membership Report" : "Church Membership Report"
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { margin: 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 20px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
    th { background: #f3f3f3; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 28px; font-size: 11px; color: #777; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    ${escapeHtml(communityLabel)} · ${escapeHtml(rangeLabel)} · ${new Date().toLocaleString()}
  </div>
  <table>
    <thead><tr><th>${en ? "Metric" : "Metric"}</th><th style="text-align:right">${en ? "Count" : "Count"}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${namesBlock}
  <div class="footer">Generated from BYB Database</div>
</body>
</html>`

    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.navigation.generateReport}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {en
            ? "Choose a date range and metrics, then print a membership summary document."
            : "Choose a date range and metrics, then print a membership summary document."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{en ? "Configuration" : "Configuration"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{en ? "From" : "From"}</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{en ? "To" : "To"}</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>

            {!scopedCommunity && (
              <div className="space-y-2">
                <Label>{en ? "Sub-community" : "Sub-community"}</Label>
                <Select value={community} onValueChange={setCommunity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{en ? "All" : "All"}</SelectItem>
                    {COMMUNITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <Label htmlFor="include-names" className="cursor-pointer">
                {en ? "Include member names" : "Include member names"}
              </Label>
              <Switch id="include-names" checked={includeNames} onCheckedChange={setIncludeNames} />
            </div>

            <div className="space-y-2">
              <Label>{en ? "Metrics" : "Metrics"}</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {ALL_METRICS.map((m) => (
                  <label key={m.key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedMetrics.includes(m.key)}
                      onCheckedChange={(v) => toggleMetric(m.key, Boolean(v))}
                    />
                    {metricLabels.get(m.key) || m.en}
                  </label>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => setGenerated(true)}
              disabled={loading || selectedMetrics.length === 0}
            >
              <FileText className="h-4 w-4" />
              {en ? "Generate" : "Generate"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">{en ? "Preview" : "Preview"}</CardTitle>
            {generated && (
              <Button size="sm" variant="outline" className="gap-2" onClick={printReport}>
                <Printer className="h-4 w-4" />
                {en ? "Print" : "Print"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!generated ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                <p className="text-sm">
                  {en
                    ? "Configure options and click Generate to preview the report."
                    : "Configure options and click Generate to preview the report."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {fromDate || toDate
                    ? `${fromDate || "..."} -> ${toDate || "..."}`
                    : en
                      ? "All dates"
                      : "All dates"}
                  {" · "}
                  {scopedCommunity
                    ? scopedCommunity
                    : community === "all"
                      ? "All sub-communities"
                      : community}
                  {" · "}
                  {filtered.length} {en ? "records in scope" : "records in scope"}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedMetrics.map((key) => (
                    <div key={key} className="rounded-xl border border-border bg-card px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {metricLabels.get(key)}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">{metrics[key]}</p>
                    </div>
                  ))}
                </div>

                {includeNames && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      {en ? "Names" : "Names"} ({filtered.length})
                    </h3>
                    <ul className="max-h-72 columns-1 gap-x-8 overflow-y-auto rounded-lg border border-border p-3 text-sm sm:columns-2">
                      {filtered.map((m) => (
                        <li key={m.id} className="mb-1 break-inside-avoid">
                          {memberDisplayName(m)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
