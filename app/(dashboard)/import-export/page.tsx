"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useBulkCreateMembers } from "@/lib/api/hooks"
import { membersService, type BulkImportSummary } from "@/lib/api/services/members.service"
import {
  downloadMemberTemplate,
  parseFileToRows,
  validateMemberRow,
  downloadCSV,
  downloadExcel,
  downloadPDF,
  MEMBER_EXPORT_COLUMNS,
  type ExportColumn,
} from "@/lib/utils/import-export"
import type { CreateMemberDto } from "@/lib/api/types"

const PREVIEW_LIMIT = 10

const CONTACT_COLUMNS: ExportColumn[] = MEMBER_EXPORT_COLUMNS.filter((c) =>
  ["fullName", "phoneNumber", "subCommunity"].includes(c.key)
)

interface ValidatedFile {
  fileName: string
  valid: CreateMemberDto[]
  errors: { row: number; fullName: string; messages: string[] }[]
}

export default function ImportExportPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.importExport

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [validated, setValidated] = useState<ValidatedFile | null>(null)
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update">("skip")
  const [summary, setSummary] = useState<BulkImportSummary | null>(null)

  const bulkCreate = useBulkCreateMembers()

  // Export state
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv" | "pdf">("xlsx")
  const [columnPreset, setColumnPreset] = useState<"full" | "contact">("full")
  const [exporting, setExporting] = useState(false)

  async function handleFile(file: File) {
    setSummary(null)
    try {
      const rows = await parseFileToRows(file)
      const valid: CreateMemberDto[] = []
      const errors: ValidatedFile["errors"] = []
      rows.forEach((row, i) => {
        // Skip the template's description row if it was left in
        const name = String(row.fullName || "")
        if (name.startsWith("REQUIRED") || name === "") {
          const anyValue = Object.values(row).some((v) => String(v).trim() !== "")
          if (!anyValue || name.startsWith("REQUIRED")) return
        }
        const result = validateMemberRow(row)
        if (result.ok) {
          valid.push(result.dto)
        } else {
          errors.push({
            row: i + 2, // +1 header, +1 one-based
            fullName: String(row.fullName || ""),
            messages: result.errors,
          })
        }
      })
      setValidated({ fileName: file.name, valid, errors })
    } catch (error: any) {
      toast({
        title: t.parseFailed,
        description: error?.message,
        variant: "destructive",
      })
    }
  }

  async function handleImport() {
    if (!validated || validated.valid.length === 0) return
    try {
      const response = await bulkCreate.mutateAsync({
        members: validated.valid,
        duplicateStrategy,
      })
      setSummary(response.data ?? null)
      setValidated(null)
    } catch (error: any) {
      toast({
        title: t.importFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  function downloadErrorReport() {
    if (!validated) return
    const columns: ExportColumn[] = [
      { key: "row", header: t.rowNumber },
      { key: "fullName", header: t.fullName },
      { key: "messages", header: t.errorMessage },
    ]
    downloadCSV(
      validated.errors.map((e) => ({ ...e, messages: e.messages.join("; ") })),
      columns,
      "import_errors"
    )
  }

  function downloadFailedRows() {
    if (!summary || summary.failed.length === 0) return
    const columns: ExportColumn[] = [
      { key: "row", header: t.rowNumber },
      { key: "fullName", header: t.fullName },
      { key: "phoneNumber", header: tr.common.phone },
      { key: "reason", header: t.reason },
    ]
    downloadCSV(summary.failed as unknown as Record<string, unknown>[], columns, "import_failed")
  }

  async function handleExport() {
    setExporting(true)
    try {
      const members = await membersService.getAllForExport()
      const columns = columnPreset === "full" ? MEMBER_EXPORT_COLUMNS : CONTACT_COLUMNS
      const data = members as unknown as Record<string, unknown>[]
      if (exportFormat === "xlsx") await downloadExcel(data, columns, "members_export")
      else if (exportFormat === "csv") await downloadCSV(data, columns, "members_export")
      else await downloadPDF(data, columns, "members_export", tr.members.title)
      toast({ title: t.exportSuccess.replace("{count}", String(members.length)) })
    } catch (error: any) {
      toast({
        title: t.exportFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import" className="gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            {t.importTab}
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            {t.exportTab}
          </TabsTrigger>
        </TabsList>

        {/* ─── Import ─── */}
        <TabsContent value="import" className="space-y-6">
          {/* Summary after import */}
          {summary ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {t.summaryTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: t.total, value: summary.total },
                    { label: t.inserted, value: summary.inserted, color: "text-green-600" },
                    { label: t.updated, value: summary.updated, color: "text-blue-600" },
                    { label: t.skipped, value: summary.skippedDuplicates, color: "text-yellow-600" },
                    { label: t.failed, value: summary.failed.length, color: "text-red-600" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color || ""}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {summary.failed.length > 0 && (
                  <div className="space-y-3">
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.rowNumber}</TableHead>
                            <TableHead>{t.fullName}</TableHead>
                            <TableHead>{t.reason}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.failed.map((f, i) => (
                            <TableRow key={i}>
                              <TableCell>{f.row}</TableCell>
                              <TableCell>{f.fullName || "—"}</TableCell>
                              <TableCell className="text-sm text-destructive">
                                {f.reason}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadFailedRows} className="gap-2">
                      <Download className="w-4 h-4" />
                      {t.downloadFailedRows}
                    </Button>
                  </div>
                )}

                <Button variant="outline" onClick={() => setSummary(null)}>
                  {t.importAnother}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Step 1: template */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.step1Title}</CardTitle>
                  <CardDescription>{t.step1Desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => downloadMemberTemplate()} className="gap-2">
                    <Download className="w-4 h-4" />
                    {t.downloadTemplate}
                  </Button>
                </CardContent>
              </Card>

              {/* Step 2: upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.step2Title}</CardTitle>
                  <CardDescription>{t.step2Desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file)
                      e.target.value = ""
                    }}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    {t.chooseFile}
                  </Button>
                  {validated && (
                    <span className="ml-3 text-sm text-muted-foreground">
                      {validated.fileName}
                    </span>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: review */}
              {validated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.step3Title}</CardTitle>
                    <div className="flex gap-3 pt-1">
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.validRows}: {validated.valid.length}
                      </Badge>
                      <Badge
                        variant={validated.errors.length > 0 ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {t.errorRows}: {validated.errors.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Errors table */}
                    {validated.errors.length > 0 && (
                      <div className="space-y-3">
                        <div className="max-h-56 overflow-y-auto border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">{t.rowNumber}</TableHead>
                                <TableHead>{t.fullName}</TableHead>
                                <TableHead>{t.errorMessage}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validated.errors.map((e) => (
                                <TableRow key={e.row}>
                                  <TableCell>{e.row}</TableCell>
                                  <TableCell>{e.fullName || "—"}</TableCell>
                                  <TableCell className="text-sm text-destructive">
                                    {e.messages.join("; ")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-2">
                          <Download className="w-4 h-4" />
                          {t.downloadErrors}
                        </Button>
                      </div>
                    )}

                    {/* Valid preview */}
                    {validated.valid.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">
                          {t.previewTitle.replace(
                            "{count}",
                            String(Math.min(PREVIEW_LIMIT, validated.valid.length))
                          )}
                        </p>
                        <div className="max-h-64 overflow-auto border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.fullName}</TableHead>
                                <TableHead>{tr.common.phone}</TableHead>
                                <TableHead>{tr.churchGrouping.subCommunity}</TableHead>
                                <TableHead>{t.maritalStatus}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validated.valid.slice(0, PREVIEW_LIMIT).map((m, i) => (
                                <TableRow key={i}>
                                  <TableCell>{m.fullName}</TableCell>
                                  <TableCell>{m.phoneNumber}</TableCell>
                                  <TableCell>{m.subCommunity}</TableCell>
                                  <TableCell>{m.maritalStatus}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Duplicate strategy */}
                        <div className="space-y-2 pt-2">
                          <Label>{t.duplicateStrategy}</Label>
                          <p className="text-xs text-muted-foreground">{t.duplicateRows}</p>
                          <RadioGroup
                            value={duplicateStrategy}
                            onValueChange={(v) => setDuplicateStrategy(v as "skip" | "update")}
                            className="flex gap-6 pt-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="skip" id="dup-skip" />
                              <Label htmlFor="dup-skip" className="font-normal">
                                {t.skipDuplicates}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="update" id="dup-update" />
                              <Label htmlFor="dup-update" className="font-normal">
                                {t.updateDuplicates}
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <Button
                          onClick={handleImport}
                          disabled={bulkCreate.isPending}
                          className="gap-2"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                          {bulkCreate.isPending
                            ? t.importing
                            : t.importBtn.replace("{count}", String(validated.valid.length))}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── Export ─── */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.exportTitle}</CardTitle>
              <CardDescription>{t.exportDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label>{t.columnsPreset}</Label>
                <Select
                  value={columnPreset}
                  onValueChange={(v) => setColumnPreset(v as "full" | "contact")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">{t.presetFull}</SelectItem>
                    <SelectItem value="contact">{t.presetContact}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.format}</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as "xlsx" | "csv" | "pdf")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExport} disabled={exporting} className="gap-2">
                <ArrowUpFromLine className="w-4 h-4" />
                {exporting ? t.exporting : t.exportBtn}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
