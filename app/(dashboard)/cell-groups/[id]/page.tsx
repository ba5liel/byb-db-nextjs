"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserMinus,
  Users,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { isChildrenAdmin, isSuperAdmin } from "@/lib/role-utils"
import {
  addCellGroupMembers,
  deleteCellGroup,
  getAvailableCellMembers,
  getCellGroup,
  removeCellGroupMember,
  updateCellGroup,
  type CellGroup,
  type CellGroupMember,
} from "@/lib/cell-groups-api"

function asMembers(group: CellGroup | null): CellGroupMember[] {
  if (!group?.memberIds?.length) return []
  return group.memberIds.filter(
    (m): m is CellGroupMember => typeof m === "object" && m !== null && "_id" in m,
  )
}

export default function CellGroupDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const en = locale !== "am"
  const canEdit = isSuperAdmin(user?.role)

  const [group, setGroup] = useState<CellGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [pool, setPool] = useState<CellGroupMember[]>([])
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [savingName, setSavingName] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setGroup(await getCellGroup(id))
    } catch (error) {
      toast({
        title: en ? "Could not load cell group" : "ሴል ግሩፕ መጫን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }, [id, en, toast])

  useEffect(() => {
    if (isChildrenAdmin(user?.role)) {
      router.replace("/")
      return
    }
    load()
  }, [load, user?.role, router])

  useEffect(() => {
    if (!canEdit || !group) return
    let active = true
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await getAvailableCellMembers(
          group.subCommunity,
          search,
          30,
        )
        if (active) setPool(data)
      } catch {
        if (active) setPool([])
      } finally {
        if (active) setSearching(false)
      }
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [canEdit, group, search])

  async function handleAdd(memberId: string) {
    setBusy(true)
    try {
      const updated = await addCellGroupMembers(id, [memberId])
      setGroup(updated)
      toast({ title: en ? "Member added" : "አባል ታክሏል" })
    } catch (error) {
      toast({
        title: en ? "Could not add member" : "አባል ማከል አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(memberId: string) {
    setBusy(true)
    try {
      const updated = await removeCellGroupMember(id, memberId)
      setGroup(updated)
      toast({ title: en ? "Member removed" : "አባል ተወግዷል" })
    } catch (error) {
      toast({
        title: en ? "Could not remove member" : "አባል ማስወገድ አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRename() {
    const next = nameDraft.trim()
    if (!next || next === group?.name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const updated = await updateCellGroup(id, { name: next })
      setGroup(updated)
      setEditingName(false)
      toast({ title: en ? "Name updated" : "ስም ተዘምኗል" })
    } catch (error) {
      toast({
        title: en ? "Could not update name" : "ስም ማዘመን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSavingName(false)
    }
  }

  async function handleDelete() {
    if (!confirm(en ? "Delete this cell group?" : "ይህን ሴል ግሩፕ መሰረዝ?")) return
    setBusy(true)
    try {
      await deleteCellGroup(id)
      toast({ title: en ? "Deleted" : "ተሰርዟል" })
      router.push("/cell-groups")
    } catch (error) {
      toast({
        title: en ? "Could not delete" : "መሰረዝ አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {en ? "Cell group not found" : "ሴል ግሩፕ አልተገኘም"}
      </div>
    )
  }

  const members = asMembers(group)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/cell-groups">
            <Button variant="ghost" className="mb-2 gap-2">
              <ArrowLeft className="h-4 w-4" />
              {en ? "Back" : "ተመለስ"}
            </Button>
          </Link>
          {editingName && canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-10 max-w-md text-lg font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") setEditingName(false)
                }}
              />
              <Button
                size="icon"
                className="h-9 w-9"
                onClick={handleRename}
                disabled={savingName}
              >
                {savingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                onClick={() => setEditingName(false)}
                disabled={savingName}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setNameDraft(group.name)
                    setEditingName(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {group.subCommunity}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {members.length} {en ? "members" : "አባላት"}
            </span>
          </div>
        </div>
        {canEdit && (
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete} disabled={busy}>
            <Trash2 className="h-4 w-4" />
            {en ? "Delete" : "ሰርዝ"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {en ? "Members" : "አባላት"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {en
                  ? "No members yet. Add from the available pool."
                  : "እስካሁን አባል የለም። ከሚገኙት ውስጥ ያክሉ።"}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {members.map((m) => (
                  <li
                    key={m._id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/members/${m._id}`}
                        className="font-medium hover:underline"
                      >
                        {m.fullName || "—"}
                      </Link>
                      {m.phoneNumber && (
                        <p className="text-xs text-muted-foreground">{m.phoneNumber}</p>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        disabled={busy}
                        onClick={() => handleRemove(m._id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {en ? "Add members" : "አባላት ጨምር"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    en
                      ? "Search available members in this sub-community…"
                      : "በዚህ ንዑስ ማህበረሰብ ያሉ አባላትን ፈልግ…"
                  }
                  className="pl-10"
                />
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pool.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {en ? "No available members" : "ያሉ አባላት የሉም"}
                  </p>
                ) : (
                  pool.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      disabled={busy}
                      onClick={() => handleAdd(m._id)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                    >
                      <span>
                        {m.fullName}
                        {m.phoneNumber ? (
                          <span className="text-muted-foreground"> · {m.phoneNumber}</span>
                        ) : null}
                      </span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
