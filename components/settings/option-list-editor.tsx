"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import {
  useAddOptionItem,
  useUpdateOptionItem,
  useDeleteOptionItem,
  useReorderOptionList,
} from "@/lib/api/hooks/use-system-config"
import type { ConfigOptionItem, ConfigListResource } from "@/lib/api/types"

interface OptionListEditorProps {
  resource: ConfigListResource
  title: string
  items: ConfigOptionItem[]
}

const EMPTY_FORM = { key: "", labelEn: "", labelAm: "" }

export function OptionListEditor({ resource, title, items }: OptionListEditorProps) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.settings

  const addItem = useAddOptionItem()
  const updateItem = useUpdateOptionItem()
  const deleteItem = useDeleteOptionItem()
  const reorder = useReorderOptionList()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const sorted = [...items].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  )

  function openAdd() {
    setEditingKey(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(item: ConfigOptionItem) {
    setEditingKey(item.key)
    setForm({ key: item.key, labelEn: item.labelEn, labelAm: item.labelAm })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editingKey) {
        await updateItem.mutateAsync({
          resource,
          key: editingKey,
          item: { labelEn: form.labelEn, labelAm: form.labelAm },
        })
      } else {
        await addItem.mutateAsync({
          resource,
          item: {
            key: form.key.trim().toLowerCase().replace(/\s+/g, "_"),
            labelEn: form.labelEn,
            labelAm: form.labelAm,
          },
        })
      }
      toast({ title: t.saved })
      setDialogOpen(false)
    } catch (error: any) {
      toast({
        title: t.saveFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!deleteKey) return
    try {
      await deleteItem.mutateAsync({ resource, key: deleteKey })
      toast({ title: t.saved })
    } catch (error: any) {
      toast({
        title: t.saveFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setDeleteKey(null)
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= sorted.length) return
    const keys = sorted.map((i) => i.key)
    ;[keys[index], keys[target]] = [keys[target], keys[index]]
    try {
      await reorder.mutateAsync({ resource, orderedKeys: keys })
    } catch (error: any) {
      toast({
        title: t.saveFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  const pending =
    addItem.isPending || updateItem.isPending || deleteItem.isPending || reorder.isPending

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {sorted.length} {tr.common.all.toLowerCase()}
          </CardDescription>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1">
          <Plus className="w-4 h-4" />
          {t.addItem}
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t.noItems}</p>
        ) : (
          <ul className="divide-y">
            {sorted.map((item, index) => (
              <li key={item.key} className="flex items-center gap-3 py-2.5">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0 || pending}
                    onClick={() => move(index, -1)}
                    aria-label={t.moveUp}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === sorted.length - 1 || pending}
                    onClick={() => move(index, 1)}
                    aria-label={t.moveDown}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {locale === "am" ? item.labelAm : item.labelEn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {locale === "am" ? item.labelEn : item.labelAm}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {item.key}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(item)}
                  aria-label={t.editItem}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteKey(item.key)}
                  aria-label={tr.common.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? t.editItem : t.addItem}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingKey && (
              <div className="space-y-2">
                <Label htmlFor={`${resource}-key`}>{t.key}</Label>
                <Input
                  id={`${resource}-key`}
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder={t.keyHint}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${resource}-en`}>{t.labelEn}</Label>
              <Input
                id={`${resource}-en`}
                value={form.labelEn}
                onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${resource}-am`}>{t.labelAm}</Label>
              <Input
                id={`${resource}-am`}
                value={form.labelAm}
                onChange={(e) => setForm((f) => ({ ...f, labelAm: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tr.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pending || !form.labelEn || (!editingKey && !form.key)}
            >
              {pending ? tr.common.saving : tr.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteKey} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tr.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
