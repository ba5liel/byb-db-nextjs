"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useLanguage } from "@/lib/language-context"
import { toast } from "@/hooks/use-toast"
import {
  importMembersFromExcel,
  type ImportMembersResult,
} from "@/lib/members-import-api"
import { getSefers } from "@/lib/sefers-api"
import type { Sefer } from "@/lib/types"
import { ArrowLeft, FileSpreadsheet, Loader2, Upload } from "lucide-react"

export default function MembersImportPage() {
  const { locale } = useLanguage()
  const am = locale === "am"

  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState(true)
  const [sefers, setSefers] = useState<Sefer[]>([])
  const [seferId, setSeferId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingSefers, setLoadingSefers] = useState(true)
  const [result, setResult] = useState<ImportMembersResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getSefers()
        if (!cancelled) setSefers(data)
      } catch {
        if (!cancelled) setSefers([])
      } finally {
        if (!cancelled) setLoadingSefers(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedSefer = useMemo(
    () => sefers.find((s) => s._id === seferId),
    [sefers, seferId],
  )

  const title = am ? "ከ Excel አባላት አስገባ" : "Import members from Excel"
  const subtitle = am
    ? "ሰፈር አንድ ጊዜ ይምረጡ፣ ከዚያ የአባላት Excel ይስቀሉ"
    : "Pick the neighborhood once, then upload the member Excel for that area"

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
    if (!seferId) {
      toast({
        title: am ? "ሰፈር ይምረጡ" : "Select neighborhood",
        description: am
          ? "ለዚህ ቡድን ማስገባት ሰፈር (neighborhood) ይምረጡ"
          : "Choose the sefer/neighborhood for this import batch",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await importMembersFromExcel({
        file,
        dryRun,
        seferId,
      })
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
          ? `${data.created} ተሳክተዋል · ${data.skipped} ተዘልለዋል · ${data.failed} ስህተት`
          : `${data.created} created · ${data.skipped} skipped · ${data.failed} failed`,
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
      <div className="space-y-5 max-w-5xl">
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
            <CardDescription>
              {am
                ? "ዓምዶች፡ ስም፣ ጾታ፣ ስልክ፣ AGE፣ ወንድ/ሴት፣ የልደትቀን፣ የጥምቀትቀን፣ ቡድን፣ የመጡበት ቤ/ክ፣ ጊዜ፣ አገልግሎት፣ VELLAG፣ …"
                : "Columns: ስም, ጾታ, ስልክ, AGE, ወንድ/ሴት, የልደትቀን, የጥምቀትቀን, group, transfer, service, …"}{" "}
              <a
                href="/jemo-members-import.xlsx"
                className="underline underline-offset-2 text-foreground"
                download
              >
                {am ? "ናሙና Excel አውርድ" : "Download sample Excel"}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{am ? "ሰፈር (ለሁሉም ረድፎች)" : "Neighborhood for all rows"}</Label>
              <Select
                value={seferId || undefined}
                onValueChange={setSeferId}
                disabled={loadingSefers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingSefers
                        ? am
                          ? "ሰፈሮች በመጫን ላይ..."
                          : "Loading neighborhoods..."
                        : am
                          ? "ሰፈር ይምረጡ (ለምሳሌ ጀሞ)"
                          : "Select sefer (e.g. Jemmo)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sefers.map((s) => {
                    const label = s.nameAmharic
                      ? `${s.name} / ${s.nameAmharic}`
                      : s.name
                    return (
                      <SelectItem key={s._id} value={s._id}>
                        {label} ({s.churchGroup})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {am
                  ? "ከተመሳሳይ ሰፈር ቡድን ስታስገቡ አንድ ጊዜ ብቻ ይምረጡ — በ Excel ውስጥ VELLAG መድገም አያስፈልግም።"
                  : "For a same-neighborhood batch, select once here — you don’t need VELLAG on every Excel row."}
                {selectedSefer
                  ? ` ${am ? "ተመርጧል፡" : "Selected:"} ${selectedSefer.name} → ${selectedSefer.churchGroup}`
                  : ""}
              </p>
            </div>

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
                    ? "መጀመሪያ ያረጋግጡ፣ ከዚያ ሳጥኑን አጥፍተው እንደገና ያስገቡ"
                    : "Validate first, then uncheck and import again to save"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !file || !seferId}
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
              <CardTitle className="text-lg">
                {am ? "ውጤት" : "Results"}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-2 pt-1">
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
                <Badge variant="outline">
                  {am ? "ተዘለለ" : "Skipped"}: {result.skipped}
                </Badge>
                <Badge variant="destructive">
                  {am ? "ስህተት" : "Failed"}: {result.failed}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{am ? "ረድፍ" : "Row"}</TableHead>
                      <TableHead>{am ? "ስም" : "Name"}</TableHead>
                      <TableHead>{am ? "ሁኔታ" : "Status"}</TableHead>
                      <TableHead>{am ? "መለያ" : "Membership #"}</TableHead>
                      <TableHead>{am ? "መልእክት" : "Message"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((row) => (
                      <TableRow key={`${row.row}-${row.fullName}`}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell className="font-medium">
                          {row.fullName || "—"}
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
                        <TableCell>{row.membershipNumber || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-md">
                          {row.message || "—"}
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
