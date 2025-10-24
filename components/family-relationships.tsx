"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Trash2, UserPlus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { FamilyRelationship } from "@/lib/types"

interface FamilyRelationshipsProps {
  relationships?: FamilyRelationship[]
  onAddRelationship?: (relationship: FamilyRelationship) => void
  onDeleteRelationship?: (relationshipId: string) => void
}

export function FamilyRelationships({ relationships = [], onAddRelationship, onDeleteRelationship }: FamilyRelationshipsProps) {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRelationship, setNewRelationship] = useState<Partial<FamilyRelationship>>({
    relationshipType: "Child",
    relatedMemberName: "",
    relatedMemberId: "",
  })

  const handleAddRelationship = () => {
    if (onAddRelationship && newRelationship.relatedMemberName && newRelationship.relationshipType) {
      onAddRelationship({
        id: `rel-${Date.now()}`,
        relationshipType: newRelationship.relationshipType as FamilyRelationship["relationshipType"],
        relatedMemberName: newRelationship.relatedMemberName,
        relatedMemberId: newRelationship.relatedMemberId || `member-${Date.now()}`,
      })
      
      setNewRelationship({ relationshipType: "Child", relatedMemberName: "", relatedMemberId: "" })
      setIsDialogOpen(false)
    }
  }

  const relationshipTypes = [
    { value: "Parent", label: locale === "en" ? "Parent" : "ወላጅ" },
    { value: "Child", label: locale === "en" ? "Child" : "ልጅ" },
    { value: "Spouse", label: locale === "en" ? "Spouse" : "የትዳር ጓደኛ" },
    { value: "Sibling", label: locale === "en" ? "Sibling" : "ወንድም/እህት" },
  ]

  const getRelationshipBadgeVariant = (type: string) => {
    switch (type) {
      case "Parent": return "default"
      case "Child": return "secondary"
      case "Spouse": return "destructive"
      case "Sibling": return "outline"
      default: return "outline"
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {locale === "en" ? "Family Relationships" : "የቤተሰብ ግንኙነቶች"}
            </CardTitle>
            <CardDescription>
              {locale === "en" 
                ? "Manage family connections and relationships" 
                : "የቤተሰብ ግንኙነቶችን እና ግንኙነቶችን ያስተዳድሩ"}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {locale === "en" ? "Add Relationship" : "ግንኙነት ጨምር"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{locale === "en" ? "Add Family Relationship" : "የቤተሰብ ግንኙነት ጨምር"}</DialogTitle>
                <DialogDescription>
                  {locale === "en" 
                    ? "Link this member to another family member" 
                    : "ይህን አባል ከሌላ የቤተሰብ አባል ጋር ያገናኙ"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="relType">{locale === "en" ? "Relationship Type" : "የግንኙነት አይነት"}</Label>
                  <Select 
                    value={newRelationship.relationshipType} 
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, relationshipType: value as FamilyRelationship["relationshipType"] }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="relName">
                    {locale === "en" ? "Related Member Name" : "ተዛማጅ አባል ስም"}
                  </Label>
                  <Input 
                    id="relName" 
                    value={newRelationship.relatedMemberName}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, relatedMemberName: e.target.value }))}
                    className="mt-1"
                    placeholder={locale === "en" ? "Enter name" : "ስም ያስገቡ"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {locale === "en" 
                      ? "If member exists in system, you can link to their profile" 
                      : "አባሉ በስርዓቱ ውስጥ ካለ ወደ መገለጫቸው ማገናኘት ይችላሉ"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="relId">
                    {locale === "en" ? "Member ID (Optional)" : "የአባል መለያ (አማራጭ)"}
                  </Label>
                  <Input 
                    id="relId" 
                    value={newRelationship.relatedMemberId}
                    onChange={(e) => setNewRelationship(prev => ({ ...prev, relatedMemberId: e.target.value }))}
                    className="mt-1"
                    placeholder="MEM-XXXXX"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleAddRelationship} disabled={!newRelationship.relatedMemberName}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t.common.add}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {relationships.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{locale === "en" ? "No family relationships added yet" : "ገና ምንም የቤተሰብ ግንኙነቶች አልተጨመሩም"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {relationships.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{rel.relatedMemberName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRelationshipBadgeVariant(rel.relationshipType)} className="text-xs">
                        {relationshipTypes.find(t => t.value === rel.relationshipType)?.label || rel.relationshipType}
                      </Badge>
                      {rel.relatedMemberId && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {rel.relatedMemberId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteRelationship?.(rel.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

