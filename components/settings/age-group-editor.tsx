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
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useUpdateAgeGroup } from "@/lib/api/hooks/use-system-config"
import type { AgeGroupDefinition } from "@/lib/api/types"

interface AgeGroupEditorProps {
  items: AgeGroupDefinition[]
}

export function AgeGroupEditor({ items }: AgeGroupEditorProps) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.settings

  const updateAgeGroup = useUpdateAgeGroup()

  const [editing, setEditing] = useState<AgeGroupDefinition | null>(null)
  const [form, setForm] = useState({ minAge: 0, maxAge: 0 })

  function openEdit(item: AgeGroupDefinition) {
    setEditing(item)
    setForm({ minAge: item.minAge, maxAge: item.maxAge })
  }

  async function handleSubmit() {
    if (!editing) return
    try {
      await updateAgeGroup.mutateAsync({
        key: editing.key,
        item: { minAge: form.minAge, maxAge: form.maxAge },
      })
      toast({ title: t.saved })
      setEditing(null)
    } catch (error: any) {
      toast({
        title: t.saveFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.ageGroups}</CardTitle>
        <CardDescription>
          {t.minAge} / {t.maxAge}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t.noItems}</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {locale === "am" ? item.labelAm : item.labelEn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {locale === "am" ? item.labelEn : item.labelAm}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {item.minAge} – {item.maxAge}
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t.editItem}
              {editing ? ` — ${locale === "am" ? editing.labelAm : editing.labelEn}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age-min">{t.minAge}</Label>
              <Input
                id="age-min"
                type="number"
                min={0}
                max={150}
                value={form.minAge}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minAge: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age-max">{t.maxAge}</Label>
              <Input
                id="age-max"
                type="number"
                min={0}
                max={150}
                value={form.maxAge}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxAge: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {tr.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateAgeGroup.isPending || form.maxAge < form.minAge}
            >
              {updateAgeGroup.isPending ? tr.common.saving : tr.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
