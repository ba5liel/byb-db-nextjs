"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { isSuperAdmin } from "@/lib/role-utils"
import {
  createCellGroup,
  getAvailableCellMembers,
  type CellGroupMember,
  type SubCommunityId,
} from "@/lib/cell-groups-api"

const COMMUNITIES: SubCommunityId[] = ["jemmo", "bethel", "weyira", "alpha"]

export default function NewCellGroupPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const en = locale !== "am"

  const [name, setName] = useState("")
  const [subCommunity, setSubCommunity] = useState<SubCommunityId | "">("")
  const [search, setSearch] = useState("")
  const [pool, setPool] = useState<CellGroupMember[]>([])
  const [selected, setSelected] = useState<CellGroupMember[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin(user?.role)) router.replace("/cell-groups")
  }, [user?.role, router])

  const loadPool = useCallback(async () => {
    if (!subCommunity) {
      setPool([])
      return
    }
    setSearching(true)
    try {
      const data = await getAvailableCellMembers(subCommunity, search, 30)
      const selectedIds = new Set(selected.map((m) => m._id))
      setPool(data.filter((m) => !selectedIds.has(m._id)))
    } catch {
      setPool([])
    } finally {
      setSearching(false)
    }
  }, [subCommunity, search, selected])

  useEffect(() => {
    const t = setTimeout(loadPool, 250)
    return () => clearTimeout(t)
  }, [loadPool])

  function toggleSelect(member: CellGroupMember) {
    setSelected((prev) =>
      prev.some((m) => m._id === member._id)
        ? prev.filter((m) => m._id !== member._id)
        : [...prev, member],
    )
  }

  async function handleCreate() {
    if (!name.trim() || !subCommunity) {
      toast({
        title: en ? "Name and sub-community required" : "ስም እና ንዑስ ማህበረሰብ ያስፈልጋሉ",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const group = await createCellGroup({
        name: name.trim(),
        subCommunity,
        memberIds: selected.map((m) => m._id),
      })
      toast({ title: en ? "Cell group created" : "ሴል ግሩፕ ተፈጥሯል" })
      router.push(`/cell-groups/${group._id}`)
    } catch (error) {
      toast({
        title: en ? "Could not create cell group" : "ሴል ግሩፕ መፍጠር አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin(user?.role)) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/cell-groups">
        <Button variant="ghost" className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" />
          {en ? "Back" : "ተመለስ"}
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          {en ? "Create cell group" : "ሴል ግሩፕ ፍጠር"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {en
            ? "Choose a sub-community, then optionally add members who are not in another cell group."
            : "ንዑስ ማህበረሰብ ይምረጡ፣ ከዚያ በሌላ ሴል ግሩፕ ያልገቡ አባላትን በፍላጎት ያክሉ።"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {en ? "Details" : "ዝርዝር"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{en ? "Name" : "ስም"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={en ? "e.g. Bethel Cell A" : "ለምሳሌ ቤቴል ሴል ሀ"}
            />
          </div>
          <div className="space-y-2">
            <Label>{en ? "Sub-community" : "ንዑስ ማህበረሰብ"}</Label>
            <Select
              value={subCommunity}
              onValueChange={(v) => {
                setSubCommunity(v as SubCommunityId)
                setSelected([])
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={en ? "Select…" : "ይምረጡ…"} />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {en ? "Add members (optional)" : "አባላት ጨምር (አማራጭ)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subCommunity ? (
            <p className="text-sm text-muted-foreground">
              {en
                ? "Select a sub-community first to search available members."
                : "አባላትን ለመፈለግ መጀመሪያ ንዑስ ማህበረሰብ ይምረጡ።"}
            </p>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={en ? "Search available members…" : "ያሉ አባላትን ፈልግ…"}
                  className="pl-10"
                />
              </div>

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map((m) => (
                    <Badge key={m._id} variant="secondary" className="gap-1 pr-1">
                      {m.fullName}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-muted"
                        onClick={() => toggleSelect(m)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {searching ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pool.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {en ? "No available members found" : "ያሉ አባላት አልተገኙም"}
                  </p>
                ) : (
                  pool.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => toggleSelect(m)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
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
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/cell-groups">
          <Button variant="outline">{en ? "Cancel" : "ሰርዝ"}</Button>
        </Link>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : en ? "Create" : "ፍጠር"}
        </Button>
      </div>
    </div>
  )
}
