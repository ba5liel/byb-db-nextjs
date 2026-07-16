"use client"

/**
 * Bulk household registration.
 * Optional family name plus dynamic member rows; each row creates a brand-new
 * member. subCommunity is derived from the selected sefer's church group.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createHousehold, type CreateHouseholdMemberDto } from "@/lib/families-api"
import { getSefers } from "@/lib/sefers-api"
import type { ChurchGroup, FamilyRole, Sefer } from "@/lib/types"
import {
  CHURCH_GROUP_LABELS,
  FAMILY_ROLES,
  roleLabel,
} from "@/components/families/family-labels"

interface MemberRow {
  key: string
  role: FamilyRole
  firstName: string
  fatherName: string
  grandfatherName: string
  sex: "male" | "female"
  phoneNumber: string
  birthDate: string
  birthYearEthiopian: string
  seferId: string
  maritalStatus: "unmarried" | "married" | "divorced" | "widowed"
  paysTithe: "yes" | "no" | "unknown"
}

let rowCounter = 0
function emptyRow(role: FamilyRole = "father"): MemberRow {
  rowCounter += 1
  return {
    key: `row-${rowCounter}`,
    role,
    firstName: "",
    fatherName: "",
    grandfatherName: "",
    sex: "male",
    phoneNumber: "",
    birthDate: "",
    birthYearEthiopian: "",
    seferId: "",
    maritalStatus: role === "child" ? "unmarried" : "unmarried",
    paysTithe: "unknown",
  }
}

export default function NewHouseholdPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const { toast } = useToast()

  const [familyName, setFamilyName] = useState("")
  const [rows, setRows] = useState<MemberRow[]>([emptyRow("father")])
  const [sefers, setSefers] = useState<Sefer[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getSefers()
      .then((data) => setSefers(data.filter((s) => s.isActive)))
      .catch(() => setSefers([]))
  }, [])

  const updateRow = (key: string, patch: Partial<MemberRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow("child")])
  const removeRow = (key: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))

  const churchGroupFor = (seferId: string): ChurchGroup => {
    const sefer = sefers.find((s) => s._id === seferId)
    return sefer?.churchGroup ?? "jemmo"
  }

  const handleSubmit = async () => {
    // Basic client-side validation before hitting the backend.
    for (const row of rows) {
      if (!row.firstName.trim()) {
        toast({
          title: locale === "am" ? "ስም ያስፈልጋል" : "Name required",
          description:
            locale === "am"
              ? "እያንዳንዱ አባል ስም ሊኖረው ይገባል።"
              : "Every member needs at least a first name.",
          variant: "destructive",
        })
        return
      }
      if (!row.phoneNumber.trim()) {
        toast({
          title: locale === "am" ? "ስልክ ያስፈልጋል" : "Phone required",
          description:
            locale === "am"
              ? "እያንዳንዱ አባል የስልክ ቁጥር ሊኖረው ይገባል።"
              : "Every member needs a unique phone number.",
          variant: "destructive",
        })
        return
      }
      if (!row.birthDate) {
        toast({
          title: locale === "am" ? "የልደት ቀን ያስፈልጋል" : "Birth date required",
          variant: "destructive",
        })
        return
      }
    }

    const members = rows.map((row) => {
      const sefer = sefers.find((s) => s._id === row.seferId)
      const fullName = [row.firstName, row.fatherName, row.grandfatherName]
        .map((p) => p.trim())
        .filter(Boolean)
        .join(" ")
      const member: CreateHouseholdMemberDto = {
        fullName,
        sex: row.sex,
        birthDate: new Date(row.birthDate).toISOString(),
        phoneNumber: row.phoneNumber.trim(),
        subCommunity: churchGroupFor(row.seferId),
        cameByTransfer: false,
        maritalStatus: row.maritalStatus,
        paysTithe: row.paysTithe,
      }
      if (row.birthYearEthiopian.trim()) {
        member.birthYearEthiopian = Number(row.birthYearEthiopian)
      }
      if (sefer) {
        member.seferId = sefer._id
        member.sefer = sefer.name
      }
      return { member, role: row.role }
    })

    setSubmitting(true)
    try {
      const family = await createHousehold({
        name: familyName.trim() || undefined,
        members,
      })
      toast({
        title: locale === "am" ? "ተመዝግቧል" : "Household registered",
        description:
          locale === "am"
            ? `${members.length} አባላት ተመዝግበዋል።`
            : `${members.length} members were registered.`,
      })
      router.push(`/families/${family._id}`)
    } catch (err) {
      toast({
        title: locale === "am" ? "ምዝገባ አልተሳካም" : "Registration failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/families"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "am" ? "ቤተሰቦች" : "Families"}
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {locale === "am" ? "ቤተሰብ ይመዝግቡ" : "Register Household"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {locale === "am"
            ? "አዲስ ቤተሰብ እና ሁሉንም አባላቱን በአንድ ጊዜ ይመዝግቡ።"
            : "Register a new family and all its members at once."}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "am" ? "የቤተሰብ መረጃ" : "Household details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label>
              {locale === "am" ? "የቤተሰብ ስም (አማራጭ)" : "Family name (optional)"}
            </Label>
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={locale === "am" ? "ለምሳሌ፡ የአበበ ቤተሰብ" : "e.g. The Abebe family"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rows.map((row, index) => {
          const derivedGroup = CHURCH_GROUP_LABELS[churchGroupFor(row.seferId)]
          return (
            <Card key={row.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {locale === "am" ? `አባል ${index + 1}` : `Member ${index + 1}`}
                </CardTitle>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Role */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "ሚና" : "Role"}</Label>
                  <Select
                    value={row.role}
                    onValueChange={(v) =>
                      updateRow(row.key, {
                        role: v as FamilyRole,
                        maritalStatus:
                          v === "child" ? "unmarried" : row.maritalStatus,
                      })
                    }
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

                {/* Names */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "ስም" : "Name"}</Label>
                  <Input
                    value={row.firstName}
                    onChange={(e) => updateRow(row.key, { firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === "am" ? "የአባት ስም" : "Father's Name"}</Label>
                  <Input
                    value={row.fatherName}
                    onChange={(e) => updateRow(row.key, { fatherName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === "am" ? "የአያት ስም" : "Grandfather's Name"}</Label>
                  <Input
                    value={row.grandfatherName}
                    onChange={(e) => updateRow(row.key, { grandfatherName: e.target.value })}
                  />
                </div>

                {/* Sex */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "ጾታ" : "Sex"}</Label>
                  <Select
                    value={row.sex}
                    onValueChange={(v) => updateRow(row.key, { sex: v as "male" | "female" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{locale === "am" ? "ወንድ" : "Male"}</SelectItem>
                      <SelectItem value="female">
                        {locale === "am" ? "ሴት" : "Female"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "ስልክ ቁጥር" : "Phone number"}</Label>
                  <Input
                    value={row.phoneNumber}
                    onChange={(e) => updateRow(row.key, { phoneNumber: e.target.value })}
                    placeholder="09..."
                  />
                </div>

                {/* Birth date */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "የልደት ቀን" : "Birth date"}</Label>
                  <Input
                    type="date"
                    value={row.birthDate}
                    onChange={(e) => updateRow(row.key, { birthDate: e.target.value })}
                  />
                </div>

                {/* Ethiopian birth year */}
                <div className="space-y-2">
                  <Label>
                    {locale === "am" ? "የትውልድ ዓመት (ዓ.ም, አማራጭ)" : "Ethiopian birth year (optional)"}
                  </Label>
                  <Input
                    type="number"
                    value={row.birthYearEthiopian}
                    onChange={(e) => updateRow(row.key, { birthYearEthiopian: e.target.value })}
                    placeholder={locale === "am" ? "ለምሳሌ፡ 1990" : "e.g. 1990"}
                  />
                </div>

                {/* Sefer */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "ሰፈር" : "Sefer"}</Label>
                  <Select
                    value={row.seferId || "none"}
                    onValueChange={(v) =>
                      updateRow(row.key, { seferId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "am" ? "ይምረጡ" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {locale === "am" ? "አልተመረጠም" : "Not selected"}
                      </SelectItem>
                      {sefers.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {locale === "am" && s.nameAmharic ? s.nameAmharic : s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Derived church group */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "የቤተክርስቲያን ቡድን" : "Church group"}</Label>
                  <div className="flex h-9 items-center">
                    <Badge variant="secondary" className="font-normal">
                      {derivedGroup}
                    </Badge>
                  </div>
                </div>

                {/* Marital status */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "የጋብቻ ሁኔታ" : "Marital status"}</Label>
                  <Select
                    value={row.maritalStatus}
                    onValueChange={(v) =>
                      updateRow(row.key, {
                        maritalStatus: v as MemberRow["maritalStatus"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmarried">
                        {locale === "am" ? "ያላገባ" : "Unmarried"}
                      </SelectItem>
                      <SelectItem value="married">
                        {locale === "am" ? "ያገባ" : "Married"}
                      </SelectItem>
                      <SelectItem value="divorced">
                        {locale === "am" ? "የተፋታ" : "Divorced"}
                      </SelectItem>
                      <SelectItem value="widowed">
                        {locale === "am" ? "ባል/ሚስት የሞተበት" : "Widowed"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pays tithe */}
                <div className="space-y-2">
                  <Label>{locale === "am" ? "አስራት ይከፍላል" : "Pays tithe"}</Label>
                  <Select
                    value={row.paysTithe}
                    onValueChange={(v) =>
                      updateRow(row.key, { paysTithe: v as MemberRow["paysTithe"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{locale === "am" ? "አዎ" : "Yes"}</SelectItem>
                      <SelectItem value="no">{locale === "am" ? "አይ" : "No"}</SelectItem>
                      <SelectItem value="unknown">
                        {locale === "am" ? "አይታወቅም" : "Unknown"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          {locale === "am" ? "አባል ጨምር" : "Add member row"}
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? locale === "am"
              ? "በመመዝገብ ላይ..."
              : "Registering..."
            : locale === "am"
              ? "ቤተሰብ መዝግብ"
              : "Register Household"}
        </Button>
      </div>
    </div>
  )
}
