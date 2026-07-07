"use client"

import { useState } from "react"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Pencil, Trash2, Grid3x3, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  useCommunityOverview, useCreateCellGroup, useUpdateCellGroup, useDeleteCellGroup,
} from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { CellGroupDto, CreateCellGroupDto, SubCommunity } from "@/lib/api/types"

const COMMUNITY_LABELS: Record<string, string> = {
  jemmo:  "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alfa:   "Alfa",
}

function cap(s: string | undefined) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

interface FormState {
  name: string
  meetingLocation: string
  meetingSchedule: string
  description: string
  isActive: boolean
  leaderId: string
}

const EMPTY_FORM: FormState = {
  name: "",
  meetingLocation: "",
  meetingSchedule: "",
  description: "",
  isActive: true,
  leaderId: "",
}

export default function CellGroupsPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = use(params)
  const label = COMMUNITY_LABELS[community] ?? cap(community)
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CellGroupDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CellGroupDto | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [cellNumber, setCellNumber] = useState<string>("")

  const { data: overviewData, isLoading } = useCommunityOverview(community)
  const createMutation = useCreateCellGroup()
  const updateMutation = useUpdateCellGroup()
  const deleteMutation = useDeleteCellGroup()

  const cellGroups = overviewData?.data?.cellGroups ?? []

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setCellNumber("")
    setFormOpen(true)
  }

  function openEdit(cg: CellGroupDto) {
    setEditTarget(cg)
    setForm({
      name: cg.name ?? "",
      meetingLocation: cg.meetingLocation ?? "",
      meetingSchedule: cg.meetingSchedule ?? "",
      description: cg.description ?? "",
      isActive: cg.isActive,
      leaderId: typeof cg.leaderId === "object" && cg.leaderId !== null
        ? (cg.leaderId as { _id?: string })._id ?? ""
        : (typeof cg.leaderId === "string" ? cg.leaderId : ""),
    })
    setCellNumber(String(cg.cellNumber))
    setFormOpen(true)
  }

  async function handleSubmit() {
    if (!cellNumber || isNaN(Number(cellNumber))) {
      toast({ title: "Validation error", description: tr.cellGroups.validationError, variant: "destructive" })
      return
    }

    const payload: CreateCellGroupDto = {
      subCommunity: community as SubCommunity,
      cellNumber: Number(cellNumber),
      ...(form.name.trim() ? { name: form.name.trim() } : {}),
      ...(form.meetingLocation.trim() ? { meetingLocation: form.meetingLocation.trim() } : {}),
      ...(form.meetingSchedule.trim() ? { meetingSchedule: form.meetingSchedule.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.leaderId.trim() ? { leaderId: form.leaderId.trim() } : {}),
      isActive: form.isActive,
    }

    try {
      if (editTarget) {
        const { subCommunity: _sc, cellNumber: _cn, ...updatePayload } = payload
        await updateMutation.mutateAsync({ id: editTarget._id, data: updatePayload })
        toast({ title: tr.cellGroups.editTitle })
      } else {
        await createMutation.mutateAsync(payload)
        toast({ title: tr.cellGroups.createTitle })
      }
      setFormOpen(false)
    } catch (err) {
      toast({
        title: editTarget ? "Update failed" : "Create failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget._id)
      toast({ title: tr.cellGroups.deleteTitle })
      setDeleteTarget(null)
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/sub-communities/${community}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold mb-1">{tr.cellGroups.title.replace("{community}", label)}</h1>
          <p className="text-muted-foreground">
            {isLoading ? tr.common.loading : tr.cellGroups.activeGroups.replace("{count}", String(cellGroups.filter(cg => cg.isActive).length))}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            {tr.cellGroups.newCellGroup}
          </Button>
        </div>
      </div>

      {/* Cell groups grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : cellGroups.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-16 text-center">
            <Grid3x3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{tr.cellGroups.noGroups}</h3>
            <p className="text-muted-foreground mb-6">{tr.cellGroups.noGroupsDesc.replace("{community}", label)}</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              {tr.cellGroups.newCellGroup}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cellGroups.map(cg => {
            const leader = typeof cg.leaderId === "object" && cg.leaderId !== null
              ? (cg.leaderId as { fullName?: string; phoneNumber?: string })
              : null

            return (
              <Card
                key={cg._id}
                variant="glass"
                hover="lift"
                className={`${!cg.isActive ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-black text-primary">
                          {cg.cellNumber}
                        </span>
                        {!cg.isActive && (
                          <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full">{tr.cellGroups.inactive}</span>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {cg.name ?? `Cell Group ${cg.cellNumber}`}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => openEdit(cg)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cg)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leader ? (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Leader: </span>
                      <span className="font-semibold">{leader.fullName}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{tr.cellGroups.noLeader}</p>
                  )}
                  {cg.meetingLocation && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {cg.meetingLocation}
                    </div>
                  )}
                  {cg.meetingSchedule && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {cg.meetingSchedule}
                    </div>
                  )}
                  {cg.description && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-white/10">{cg.description}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={open => !isSaving && setFormOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editTarget ? tr.cellGroups.editTitle : tr.cellGroups.createTitle}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? tr.cellGroups.editSubtitle.replace("{number}", String(editTarget.cellNumber)).replace("{community}", label)
                : tr.cellGroups.createSubtitle.replace("{community}", label)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editTarget && (
              <div>
                <Label htmlFor="cellNumber" className="font-semibold mb-1.5 block">
                  {tr.cellGroups.cellNumberRequired}
                </Label>
                <Input
                  id="cellNumber"
                  type="number"
                  min={1}
                  placeholder={tr.cellGroups.cellNumberPlaceholder}
                  value={cellNumber}
                  onChange={e => setCellNumber(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="name" className="font-semibold mb-1.5 block">{tr.cellGroups.name}</Label>
              <Input
                id="name"
                placeholder={tr.cellGroups.namePlaceholder}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="meetingLocation" className="font-semibold mb-1.5 block">{tr.cellGroups.meetingLocation}</Label>
              <Input
                id="meetingLocation"
                placeholder={tr.cellGroups.meetingLocationPlaceholder}
                value={form.meetingLocation}
                onChange={e => setForm(f => ({ ...f, meetingLocation: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="meetingSchedule" className="font-semibold mb-1.5 block">{tr.cellGroups.meetingSchedule}</Label>
              <Input
                id="meetingSchedule"
                placeholder={tr.cellGroups.meetingSchedulePlaceholder}
                value={form.meetingSchedule}
                onChange={e => setForm(f => ({ ...f, meetingSchedule: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="leaderId" className="font-semibold mb-1.5 block">{tr.cellGroups.leaderId}</Label>
              <Input
                id="leaderId"
                placeholder={tr.cellGroups.leaderIdPlaceholder}
                value={form.leaderId}
                onChange={e => setForm(f => ({ ...f, leaderId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">{tr.cellGroups.leaderIdHelp}</p>
            </div>

            <div>
              <Label htmlFor="description" className="font-semibold mb-1.5 block">{tr.cellGroups.description}</Label>
              <Input
                id="description"
                placeholder={tr.cellGroups.descriptionPlaceholder}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={form.isActive}
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-white/20"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <Label className="font-semibold cursor-pointer" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                {tr.cellGroups.active}
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>
              {tr.cellGroups.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? tr.cellGroups.saving : editTarget ? tr.cellGroups.saveChanges : tr.cellGroups.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.cellGroups.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.cellGroups.deleteConfirm.replace("{name}", deleteTarget?.name ?? `Cell Group ${deleteTarget?.cellNumber}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.cellGroups.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tr.cellGroups.deleting : tr.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
