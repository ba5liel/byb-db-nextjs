"use client"

/**
 * Sefer management (superadmin).
 * Lists all sefers including inactive ones; create/edit/delete are
 * superadmin-only and enforced by the backend. View is gated on config:read,
 * mirroring the system-admin users page guard/shell pattern.
 */

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, MapPin, Plus, Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import {
  createSefer,
  deleteSefer,
  getSefers,
  updateSefer,
  type SeferPayload,
} from "@/lib/sefers-api"
import type { ChurchGroup, Sefer } from "@/lib/types"
import { CHURCH_GROUPS, CHURCH_GROUP_LABELS } from "@/components/families/family-labels"

interface FormState {
  name: string
  nameAmharic: string
  churchGroup: ChurchGroup
  isActive: boolean
}

const emptyForm: FormState = {
  name: "",
  nameAmharic: "",
  churchGroup: "jemmo",
  isActive: true,
}

export default function SefersAdminPage() {
  const { locale } = useLanguage()
  const { toast } = useToast()

  const [sefers, setSefers] = useState<Sefer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Sefer | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Sefer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSefers(true)
      setSefers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sefers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (sefer: Sefer) => {
    setEditing(sefer)
    setForm({
      name: sefer.name,
      nameAmharic: sefer.nameAmharic || "",
      churchGroup: sefer.churchGroup,
      isActive: sefer.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: locale === "am" ? "ስም ያስፈልጋል" : "Name required",
        variant: "destructive",
      })
      return
    }
    const payload: SeferPayload = {
      name: form.name.trim(),
      nameAmharic: form.nameAmharic.trim() || undefined,
      churchGroup: form.churchGroup,
      isActive: form.isActive,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateSefer(editing._id, payload)
        toast({ title: locale === "am" ? "ተስተካክሏል" : "Sefer updated" })
      } else {
        await createSefer(payload)
        toast({ title: locale === "am" ? "ተጨምሯል" : "Sefer created" })
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      toast({
        title: locale === "am" ? "ስህተት" : "Error",
        description: err instanceof Error ? err.message : "Failed to save sefer",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSefer(deleteTarget._id)
      toast({ title: locale === "am" ? "ተሰርዟል" : "Sefer deleted" })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({
        title: locale === "am" ? "ስህተት" : "Error",
        description: err instanceof Error ? err.message : "Failed to delete sefer",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PermissionGuard resource={Resource.CONFIG} action={Action.READ}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {locale === "am" ? "ሰፈሮች" : "Sefers"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {locale === "am"
                ? "የቤተክርስቲያን ሰፈሮችን ያስተዳድሩ"
                : "Manage church neighborhood zones"}
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "am" ? "ሰፈር ጨምር" : "Add Sefer"}
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : sefers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {locale === "am" ? "ምንም ሰፈር የለም" : "No sefers yet"}
              </p>
              <Button variant="outline" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {locale === "am" ? "የመጀመሪያውን ሰፈር ጨምር" : "Add first sefer"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "am" ? "ስም" : "Name"}</TableHead>
                    <TableHead>{locale === "am" ? "የአማርኛ ስም" : "Amharic name"}</TableHead>
                    <TableHead>{locale === "am" ? "ቡድን" : "Church group"}</TableHead>
                    <TableHead>{locale === "am" ? "ሁኔታ" : "Status"}</TableHead>
                    <TableHead className="text-right">
                      {locale === "am" ? "ተግባራት" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sefers.map((sefer) => (
                    <TableRow key={sefer._id}>
                      <TableCell className="font-medium">{sefer.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sefer.nameAmharic || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CHURCH_GROUP_LABELS[sefer.churchGroup]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sefer.isActive ? (
                          <Badge className="border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                            {locale === "am" ? "ንቁ" : "Active"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {locale === "am" ? "ንቁ ያልሆነ" : "Inactive"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(sefer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(sefer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create / edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? locale === "am"
                    ? "ሰፈር አስተካክል"
                    : "Edit Sefer"
                  : locale === "am"
                    ? "ሰፈር ጨምር"
                    : "Add Sefer"}
              </DialogTitle>
              <DialogDescription>
                {locale === "am"
                  ? "የሰፈር መረጃ ያስገቡ።"
                  : "Enter the sefer details."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === "am" ? "ስም" : "Name"}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={locale === "am" ? "የሰፈር ስም" : "Sefer name"}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === "am" ? "የአማርኛ ስም (አማራጭ)" : "Amharic name (optional)"}</Label>
                <Input
                  value={form.nameAmharic}
                  onChange={(e) => setForm((f) => ({ ...f, nameAmharic: e.target.value }))}
                  placeholder={locale === "am" ? "በአማርኛ" : "In Amharic"}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church group"}</Label>
                <Select
                  value={form.churchGroup}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, churchGroup: v as ChurchGroup }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHURCH_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {CHURCH_GROUP_LABELS[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <Label htmlFor="sefer-active">{locale === "am" ? "ንቁ" : "Active"}</Label>
                <Switch
                  id="sefer-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {locale === "am" ? "ተወው" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? locale === "am"
                    ? "በማስቀመጥ ላይ..."
                    : "Saving..."
                  : locale === "am"
                    ? "አስቀምጥ"
                    : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {locale === "am" ? "ሰፈር ሰርዝ" : "Delete Sefer"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {locale === "am"
                  ? `"${deleteTarget?.name}" ይሰረዛል። ይህ ተግባር መመለስ አይቻልም።`
                  : `"${deleteTarget?.name}" will be deleted. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{locale === "am" ? "ተወው" : "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting
                  ? locale === "am"
                    ? "በመሰረዝ ላይ..."
                    : "Deleting..."
                  : locale === "am"
                    ? "ሰርዝ"
                    : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
