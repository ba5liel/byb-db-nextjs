"use client"

/**
 * Family detail page.
 * Header, member list with role badges, add/remove member actions, and a
 * visual family tree computed from the first member's relationship graph.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ArrowLeft, Building2, Plus, Search, Trash2, UserPlus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import {
  addFamilyMember,
  getFamily,
  getFamilyTree,
  removeFamilyMember,
  type FamilyTree,
} from "@/lib/families-api"
import { getMemberById, getMembers } from "@/lib/members-api"
import type { Family, FamilyRole } from "@/lib/types"
import {
  FAMILY_ROLES,
  initial,
  memberInfo,
  roleLabel,
} from "@/components/families/family-labels"
import { FamilyTreeView } from "@/components/families/family-tree"

export default function FamilyDetailPage() {
  const params = useParams()
  const familyId = params.id as string
  const { locale } = useLanguage()
  const { toast } = useToast()

  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tree, setTree] = useState<FamilyTree | null>(null)
  const [treeLoading, setTreeLoading] = useState(false)

  const [subCommunity, setSubCommunity] = useState<string | null>(null)

  // Add-member dialog state.
  const [addOpen, setAddOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [selectedRole, setSelectedRole] = useState<FamilyRole>("child")
  const [adding, setAdding] = useState(false)

  // Remove-member confirm state.
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [removing, setRemoving] = useState(false)

  const loadFamily = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFamily(familyId)
      setFamily(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family")
    } finally {
      setLoading(false)
    }
  }, [familyId])

  useEffect(() => {
    loadFamily()
  }, [loadFamily])

  // Load the tree from the first member once the family is available.
  useEffect(() => {
    if (!family || family.members.length === 0) {
      setTree(null)
      return
    }
    const firstId = memberInfo(family.members[0]).id
    if (!firstId) return
    let active = true
    setTreeLoading(true)
    getFamilyTree(firstId)
      .then((t) => {
        if (active) setTree(t)
      })
      .catch(() => {
        if (active) setTree(null)
      })
      .finally(() => {
        if (active) setTreeLoading(false)
      })
    return () => {
      active = false
    }
  }, [family])

  // Households share one sub-community; read it off the first member with one set.
  useEffect(() => {
    if (!family || family.members.length === 0) {
      setSubCommunity(null)
      return
    }
    const firstId = memberInfo(family.members[0]).id
    if (!firstId) return
    let active = true
    getMemberById(firstId)
      .then((m) => {
        if (active) setSubCommunity(m?.subCommunity ?? null)
      })
      .catch(() => {
        if (active) setSubCommunity(null)
      })
    return () => {
      active = false
    }
  }, [family])

  // Debounced member search inside the add dialog.
  useEffect(() => {
    if (!addOpen) return
    const t = setTimeout(async () => {
      if (memberSearch.trim().length < 2) {
        setSearchResults([])
        return
      }
      setSearching(true)
      try {
        const res = await getMembers({ search: memberSearch, limit: 8 })
        setSearchResults(res.data)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [memberSearch, addOpen])

  const resetAddDialog = () => {
    setMemberSearch("")
    setSearchResults([])
    setSelectedMember(null)
    setSelectedRole("child")
  }

  const handleAdd = async () => {
    if (!selectedMember) return
    const memberId = selectedMember._id || selectedMember.id
    setAdding(true)
    try {
      await addFamilyMember(familyId, memberId, selectedRole)
      toast({
        title: locale === "am" ? "ተጨምሯል" : "Member added",
        description:
          locale === "am" ? "አባል ወደ ቤተሰብ ተጨምሯል።" : "The member was added to the family.",
      })
      setAddOpen(false)
      resetAddDialog()
      await loadFamily()
    } catch (err) {
      toast({
        title: locale === "am" ? "ስህተት" : "Error",
        description: err instanceof Error ? err.message : "Failed to add member",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeFamilyMember(familyId, removeTarget.id)
      toast({
        title: locale === "am" ? "ተወግዷል" : "Member removed",
      })
      setRemoveTarget(null)
      await loadFamily()
    } catch (err) {
      toast({
        title: locale === "am" ? "ስህተት" : "Error",
        description: err instanceof Error ? err.message : "Failed to remove member",
        variant: "destructive",
      })
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-9 w-64" />
        <Skeleton className="mb-4 h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !family) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Family not found"}</p>
            <Link href="/families" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === "am" ? "ወደ ቤተሰቦች ተመለስ" : "Back to families"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const familyName = family.name || (locale === "am" ? "ያልተሰየመ ቤተሰብ" : "Unnamed family")

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/families"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "am" ? "ቤተሰቦች" : "Families"}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{familyName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            <p>
              {locale === "am"
                ? `${family.members.length} አባላት`
                : `${family.members.length} member${family.members.length === 1 ? "" : "s"}`}
            </p>
            {subCommunity && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Building2 className="h-3 w-3" />
                {subCommunity}
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {locale === "am" ? "አባል ጨምር" : "Add member"}
        </Button>
      </div>

      {/* Members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "am" ? "አባላት" : "Members"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {family.members.map((fm, i) => {
              const info = memberInfo(fm)
              return (
                <div
                  key={info.id || i}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={info.memberPicture} alt={info.fullName} />
                    <AvatarFallback>{initial(info.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {info.id ? (
                      <Link
                        href={`/members/${info.id}`}
                        className="truncate font-medium text-foreground hover:underline"
                      >
                        {info.fullName || (locale === "am" ? "አባል" : "Member")}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-foreground">
                        {info.fullName || (locale === "am" ? "አባል" : "Member")}
                      </span>
                    )}
                    {info.membershipNumber && (
                      <p className="text-xs text-muted-foreground">{info.membershipNumber}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-normal">
                    {roleLabel(fm.role, locale)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setRemoveTarget({
                        id: info.id,
                        name: info.fullName || (locale === "am" ? "አባል" : "this member"),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Family tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "am" ? "የቤተሰብ ዛፍ" : "Family tree"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treeLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-40 rounded-lg" />
              <Skeleton className="h-24 w-72 rounded-lg" />
            </div>
          ) : tree && tree.nodes.length > 0 ? (
            <FamilyTreeView tree={tree} locale={locale} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {locale === "am"
                ? "የቤተሰብ ዛፍ ለማሳየት በቂ ግንኙነት የለም።"
                : "Not enough relationships to display a tree yet."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add member dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (!o) resetAddDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "am" ? "አባል ጨምር" : "Add member"}</DialogTitle>
            <DialogDescription>
              {locale === "am"
                ? "ነባር አባል ይፈልጉ እና ሚናቸውን ይምረጡ።"
                : "Search for an existing member and pick their role."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{locale === "am" ? "አባል ፈልግ" : "Search member"}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={locale === "am" ? "በስም ወይም ስልክ..." : "By name or phone..."}
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value)
                    setSelectedMember(null)
                  }}
                  className="pl-10"
                />
              </div>
              {(searching || searchResults.length > 0) && !selectedMember && (
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  {searching ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      {locale === "am" ? "በመፈለግ ላይ..." : "Searching..."}
                    </div>
                  ) : (
                    searchResults.map((m) => (
                      <button
                        key={m._id || m.id}
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.memberPicture} alt={m.fullName} />
                          <AvatarFallback className="text-xs">
                            {initial(m.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{m.fullName}</p>
                          {m.phoneNumber && (
                            <p className="truncate text-xs text-muted-foreground">
                              {m.phoneNumber}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedMember && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={selectedMember.memberPicture} alt={selectedMember.fullName} />
                    <AvatarFallback className="text-xs">
                      {initial(selectedMember.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm text-foreground">
                    {selectedMember.fullName}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                    {locale === "am" ? "ቀይር" : "Change"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{locale === "am" ? "ሚና" : "Role"}</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as FamilyRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAMILY_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {locale === "am" ? "ተወው" : "Cancel"}
            </Button>
            <Button onClick={handleAdd} disabled={!selectedMember || adding}>
              <Plus className="mr-2 h-4 w-4" />
              {adding
                ? locale === "am"
                  ? "በመጨመር ላይ..."
                  : "Adding..."
                : locale === "am"
                  ? "ጨምር"
                  : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "am" ? "አባል አስወግድ" : "Remove member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "am"
                ? `${removeTarget?.name} ከዚህ ቤተሰብ ይወገዳል። ይህ አባሉን አይሰርዝም።`
                : `${removeTarget?.name} will be removed from this family. This does not delete the member.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === "am" ? "ተወው" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing
                ? locale === "am"
                  ? "በማስወገድ ላይ..."
                  : "Removing..."
                : locale === "am"
                  ? "አስወግድ"
                  : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
