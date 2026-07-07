"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Trash2, Search, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useSearchMembers } from "@/lib/api/hooks"

export interface FamilyData {
  spouseId?: string
  spouseName?: string
  motherId?: string
  motherName?: string
  fatherId?: string
  fatherName?: string
  siblingIds: Array<{ id: string; name: string }>
  childrenIds: Array<{ id: string; name: string }>
}

export const emptyFamilyData = (): FamilyData => ({
  siblingIds: [],
  childrenIds: [],
})

interface FamilyRelationshipsProps {
  value: FamilyData
  onChange?: (updated: FamilyData) => void
  readOnly?: boolean
}

type RelType = "spouse" | "mother" | "father" | "sibling" | "child"

export function FamilyRelationships({ value, onChange, readOnly = false }: FamilyRelationshipsProps) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.family

  const [relType, setRelType] = useState<RelType>("spouse")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: searchData, isLoading: searching } = useSearchMembers(query, 8)
  const results = searchData?.data ?? []

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function selectMember(id: string, name: string) {
    setSelectedId(id)
    setSelectedName(name)
    setQuery(name)
    setShowDropdown(false)
  }

  function clearSelection() {
    setSelectedId("")
    setSelectedName("")
    setQuery("")
  }

  function handleAdd() {
    if (!selectedId || !selectedName) return
    const updated = { ...value }

    switch (relType) {
      case "spouse":
        updated.spouseId = selectedId
        updated.spouseName = selectedName
        break
      case "mother":
        updated.motherId = selectedId
        updated.motherName = selectedName
        break
      case "father":
        updated.fatherId = selectedId
        updated.fatherName = selectedName
        break
      case "sibling":
        if (!updated.siblingIds.find((s) => s.id === selectedId)) {
          updated.siblingIds = [...updated.siblingIds, { id: selectedId, name: selectedName }]
        }
        break
      case "child":
        if (!updated.childrenIds.find((c) => c.id === selectedId)) {
          updated.childrenIds = [...updated.childrenIds, { id: selectedId, name: selectedName }]
        }
        break
    }

    onChange?.(updated)
    clearSelection()
    setRelType("spouse")
  }

  function handleRemove(type: RelType, id?: string) {
    const updated = { ...value }
    switch (type) {
      case "spouse":
        updated.spouseId = undefined
        updated.spouseName = undefined
        break
      case "mother":
        updated.motherId = undefined
        updated.motherName = undefined
        break
      case "father":
        updated.fatherId = undefined
        updated.fatherName = undefined
        break
      case "sibling":
        updated.siblingIds = updated.siblingIds.filter((s) => s.id !== id)
        break
      case "child":
        updated.childrenIds = updated.childrenIds.filter((c) => c.id !== id)
        break
    }
    onChange?.(updated)
  }

  // Collect all linked relationships for display
  const linked: Array<{ type: RelType; id: string; name: string; label: string }> = []
  if (value.spouseId && value.spouseName) linked.push({ type: "spouse", id: value.spouseId, name: value.spouseName, label: t.spouse })
  if (value.motherId && value.motherName) linked.push({ type: "mother", id: value.motherId, name: value.motherName, label: t.mother })
  if (value.fatherId && value.fatherName) linked.push({ type: "father", id: value.fatherId, name: value.fatherName, label: t.father })
  value.siblingIds.forEach((s) => linked.push({ type: "sibling", id: s.id, name: s.name, label: t.sibling }))
  value.childrenIds.forEach((c) => linked.push({ type: "child", id: c.id, name: c.name, label: t.child }))

  const badgeVariant: Record<RelType, "default" | "secondary" | "destructive" | "outline"> = {
    spouse: "destructive",
    mother: "default",
    father: "default",
    sibling: "secondary",
    child: "outline",
  }

  const singularFilled = {
    spouse: !!value.spouseId,
    mother: !!value.motherId,
    father: !!value.fatherId,
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t.relationships}
            </CardTitle>
            <CardDescription>{t.manageConnections}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add relationship UI (hidden in readOnly) */}
        {!readOnly && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Relationship type */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">{locale === "en" ? "Relationship" : "ግንኙነት"}</Label>
                <Select value={relType} onValueChange={(v) => { setRelType(v as RelType); clearSelection() }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectRelationship} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse" disabled={singularFilled.spouse}>{t.spouse}</SelectItem>
                    <SelectItem value="mother" disabled={singularFilled.mother}>{t.mother}</SelectItem>
                    <SelectItem value="father" disabled={singularFilled.father}>{t.father}</SelectItem>
                    <SelectItem value="sibling">{t.sibling}</SelectItem>
                    <SelectItem value="child">{t.child}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Member search */}
              <div className="relative" ref={searchRef}>
                <Label className="text-xs text-muted-foreground mb-1 block">{locale === "en" ? "Member" : "አባል"}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder={t.searchMember}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSelectedId("")
                      setSelectedName("")
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showDropdown && query.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
                    {results.length === 0 && !searching ? (
                      <p className="text-sm text-muted-foreground p-3">{t.noResults}</p>
                    ) : (
                      results.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onMouseDown={() => selectMember(m._id, m.fullName)}
                        >
                          <span className="font-medium">{m.fullName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{m.membershipNumber}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!selectedId}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.addRelationship}
            </Button>
          </div>
        )}

        {/* Linked relationships */}
        {linked.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t.noRelationships}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linked.map((rel) => (
              <div
                key={`${rel.type}-${rel.id}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={badgeVariant[rel.type]} className="text-xs shrink-0">
                    {rel.label}
                  </Badge>
                  <span className="font-medium text-sm">{rel.name}</span>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(rel.type, rel.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
