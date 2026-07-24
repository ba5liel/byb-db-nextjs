"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useLanguage } from "@/lib/language-context"
import { toast } from "@/hooks/use-toast"
import {
  importMembersFromExcel,
  type ImportMembersResult,
  type ImportRowResult,
} from "@/lib/members-import-api"
import {
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Upload,
  Users,
} from "lucide-react"

const ROLE_LABELS: Record<
  NonNullable<ImportRowResult["familyRole"]>,
  { en: string; am: string }
> = {
  father: { en: "Father", am: "አባት" },
  mother: { en: "Mother", am: "እናት" },
  child: { en: "Child", am: "ልጅ" },
  independent: { en: "Independent", am: "ራሱን የቻለ" },
  other: { en: "Other", am: "ሌላ" },
}

export default function MembersImportPage() {
  const { locale } = useLanguage()
  const am = locale === "am"

  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportMembersResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onlyFlagged, setOnlyFlagged] = useState(false)

  const title = am ? "ከ Excel አባላት አስገባ" : "Import members from Excel"
  const subtitle = am
    ? "የቤተሰብ መዋቅር ያለው Excel ይስቀሉ — ቤተሰቦችና ዝምድናዎች በራስ-ሰር ይፈጠራሉ"
    : "Upload the family-structure Excel — households and relationships are created automatically"

  const statusLabel = useMemo(
    () => ({
      created: result?.dryRun
        ? am
          ? "ተረጋግጧል"
          : "Validated"
        : am
          ? "ተመዝግቧል"
          : "Created",
      skipped: am ? "ተዘለለ" : "Skipped",
      error: am ? "ስህተት" : "Error",
    }),
    [am, result?.dryRun],
  )

  const visibleResults = useMemo(() => {
    if (!result) return []
    if (!onlyFlagged) return result.results
    return result.results.filter(
      (r) => r.status === "error" || r.extendedFamily || (r.warnings?.length ?? 0) > 0,
    )
  }, [result, onlyFlagged])

  async function handleImport() {
    if (!file) {
      toast({
        title: am ? "ፋይል ይምረጡ" : "Choose a file",
        description: am
          ? "እባክዎ .xls ወይም .xlsx ፋይል ይምረጡ"
          : "Please select an .xls or .xlsx file",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await importMembersFromExcel({ file, dryRun })
      setResult(data)
      toast({
        title: data.dryRun
          ? am
            ? "ደረቅ ሙከራ ተሳክቷል"
            : "Dry run completed"
          : am
            ? "ማስገባት ተሳክቷል"
            : "Import completed",
        description: am
          ? `${data.created} አባላት · ${data.familiesCreated} ቤተሰቦች · ${data.failed} ስህተት`
          : `${data.created} members · ${data.familiesCreated} families · ${data.failed} failed`,
      })
    } catch (err: any) {
      const message = err?.message || (am ? "ማስገባት አልተሳካም" : "Import failed")
      setError(message)
      toast({
        title: am ? "ስህተት" : "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PermissionGuard resource={Resource.CHURCH_MEMBER} action={Action.CREATE}>
      <div className="space-y-5 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link href="/members">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {am ? "ወደ አባላት" : "Back to members"}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="w-5 h-5" />
              {am ? "ፋይል ስቀል" : "Upload spreadsheet"}
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="block">
                {am
                  ? "ዓምዶች፡ ስም · ሚና (F=አባት, M=እናት, C=ልጅ, I=ራሱን የቻለ) · ጾታ (ወ/ሴ) · የቤተሰብ ቁጥር · እርገነት"
                  : "Columns: ስም (name) · role (F=father, M=mother, C=child, I=independent) · Gender (ወ/ሴ) · Family number · Eregenet"}
              </span>
              <span className="block">
                {am
                  ? "እርገነት (ጀሞ ደብር አባይ፣ አልፋ፣ ቤቴል፣ ወይራ) የክፍለ-ማህበረሰቡን ቡድን ይወስናል፤ የቤተሰብ ስም የአባት የመጀመሪያ ስም ይሆናል።"
                  : "The Eregenet (ጀሞ ደብር አባይ, አልፋ, ቤቴል, ወይራ) sets each member's sub community; the family name is the father's first name."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="excel-file">{am ? "Excel ፋይል" : "Excel file"}</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  setResult(null)
                  setError(null)
                }}
              />
              {file ? (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-3 rounded-md border p-4">
              <Checkbox
                id="dry-run"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="dry-run" className="cursor-pointer">
                  {am ? "ደረቅ ሙከራ (አታስቀምጥ)" : "Dry run (do not save)"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {am
                    ? "መጀመሪያ ያረጋግጡ — የቤተሰብ አወቃቀሩን፣ ማስጠንቀቂያዎችንና የተራዘመ-ቤተሰብ ምልክቶችን ይመልከቱ፣ ከዚያ ሳጥኑን አጥፍተው እንደገና ያስገቡ"
                    : "Validate first — review households, warnings and extended-family tags, then uncheck and import again to save"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !file}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading
                ? am
                  ? "በሂደት ላይ..."
                  : "Working..."
                : dryRun
                  ? am
                    ? "ደረቅ ሙከራ አሂድ"
                    : "Run dry run"
                  : am
                    ? "አባላትን መዝግብ"
                    : "Import & register"}
            </Button>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{am ? "ማስገባት አልተሳካም" : "Import failed"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{am ? "ውጤት" : "Results"}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">
                  {am ? "ጠቅላላ" : "Total"}: {result.totalRows}
                </Badge>
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  {result.dryRun
                    ? am
                      ? "ተረጋግጧል"
                      : "Validated"
                    : am
                      ? "ተመዝግቧል"
                      : "Created"}
                  : {result.created}
                </Badge>
                <Badge className="bg-sky-600 hover:bg-sky-600 gap-1">
                  <Users className="w-3 h-3" />
                  {am ? "ቤተሰቦች" : "Families"}: {result.familiesCreated}
                </Badge>
                {result.extendedTagged > 0 ? (
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {am ? "የተራዘመ ቤተሰብ" : "Extended family"}: {result.extendedTagged}
                  </Badge>
                ) : null}
                <Badge variant="destructive">
                  {am ? "ስህተት" : "Failed"}: {result.failed}
                </Badge>
                <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground">
                  <Checkbox
                    checked={onlyFlagged}
                    onCheckedChange={(checked) => setOnlyFlagged(checked === true)}
                  />
                  {am ? "ማስጠንቀቂያ ያላቸውን ብቻ አሳይ" : "Show only flagged rows"}
                </label>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">{am ? "ረድፍ" : "Row"}</TableHead>
                      <TableHead>{am ? "ስም" : "Name"}</TableHead>
                      <TableHead>{am ? "ሚና" : "Role"}</TableHead>
                      <TableHead>{am ? "ቤተሰብ" : "Family"}</TableHead>
                      <TableHead>{am ? "ሁኔታ" : "Status"}</TableHead>
                      <TableHead>{am ? "መለያ" : "Membership #"}</TableHead>
                      <TableHead>{am ? "ማስታወሻ" : "Notes"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleResults.map((row) => (
                      <TableRow key={`${row.row}-${row.fullName}`}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell className="font-medium">
                          {row.fullName || "—"}
                        </TableCell>
                        <TableCell>
                          {row.familyRole ? (
                            <span className="flex items-center gap-1.5">
                              {ROLE_LABELS[row.familyRole][am ? "am" : "en"]}
                              {row.extendedFamily ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      {am ? "የተራዘመ" : "Extended"}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    {am
                                      ? "የአያት ስም ከቤተሰቡ ስም ጋር አይመሳሰልም — የተራዘመ ቤተሰብ (ለምሳሌ አገልጋይ ወይም ዘመድ) ሊሆን ይችላል"
                                      : "Last name doesn't match the family head — likely extended family (servant or relative in the household)"}
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.familyName
                            ? `${row.familyName}${row.familyNumber ? ` (#${row.familyNumber})` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "created"
                                ? "default"
                                : row.status === "skipped"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {statusLabel[row.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.membershipNumber || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-md">
                          {row.message ? (
                            <span className="text-destructive">{row.message}</span>
                          ) : null}
                          {row.warnings?.length ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                              {row.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          ) : row.message ? null : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PermissionGuard>
  )
}
