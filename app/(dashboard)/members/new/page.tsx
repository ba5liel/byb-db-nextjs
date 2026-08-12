"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  Heart,
  Home,
  Wallet,
  Check,
  Search,
  Loader2,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  UserPlus,
  ContactRound,
} from "lucide-react"
import { useMembers } from "@/lib/members-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import {
  FlexibleDateInput,
  formatFlexibleDate,
  ageFromEcPartial,
} from "@/components/flexible-date-input"
import { getSefers } from "@/lib/sefers-api"
import {
  searchFamilies,
  createFamily,
  addFamilyMember,
  removeFamilyMember,
  getFamily,
} from "@/lib/families-api"
import { searchMembers } from "@/lib/members-api"
import type { Member, Sefer, Family, FamilyRole, SubCommunity } from "@/lib/types"
import {
  isSubCommunitySlug,
  isAgeGroupSlug,
  SUB_COMMUNITY_BY_SLUG,
  AGE_GROUP_BY_SLUG,
  subCommunityHref,
  ageGroupHref,
  type SubCommunitySlug,
  type AgeGroupSlug,
} from "@/lib/sub-communities"

const CHURCH_GROUP_TO_SUB_COMMUNITY: Record<string, SubCommunity> = {
  jemmo: "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alpha: "Alpha",
}

type FamilyMode = "none" | "existing" | "new"

const SECTION_IDS = ["personal", "spiritual", "service-family", "education-tithe"] as const
type SectionId = (typeof SECTION_IDS)[number]

function memberInfoOf(m: Family["members"][number]) {
  return typeof m.memberId === "object"
    ? m.memberId
    : { _id: String(m.memberId), fullName: String(m.memberId), phoneNumber: undefined }
}

/** Compact labeled field wrapper. */
function Field({
  label,
  htmlFor,
  required,
  children,
  className,
}: {
  label: React.ReactNode
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
  )
}

/**
 * Fixed bottom-right step navigator. Shows the active step and doubles as a
 * two-zone jump control: the top half goes to the previous section, the
 * bottom half to the next — so the whole form is reachable without scrolling.
 */
function FloatingStepNav({
  sections,
  activeSection,
  onNavigate,
}: {
  sections: { id: SectionId; title: string; icon: React.ElementType }[]
  activeSection: SectionId
  onNavigate: (id: SectionId) => void
}) {
  const index = sections.findIndex((s) => s.id === activeSection)
  const current = sections[index]
  const prev = sections[index - 1]
  const next = sections[index + 1]

  return (
    <div className="fixed bottom-6 right-6 z-30 flex w-16 select-none flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onNavigate(prev.id)}
        title={prev?.title}
        aria-label="Previous section"
        className="flex h-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div className="flex flex-col items-center gap-0.5 border-y border-border bg-muted/40 py-2">
        {current && <current.icon className="h-4 w-4 text-primary" />}
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {index + 1}/{sections.length}
        </span>
      </div>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onNavigate(next.id)}
        title={next?.title}
        aria-label="Next section"
        className="flex h-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function NewMemberPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
      <NewMemberPageContent />
    </React.Suspense>
  )
}

function NewMemberPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const communityParam = searchParams.get("community")?.trim().toLowerCase() || ""
  const ageParam = searchParams.get("age")?.trim().toLowerCase() || ""
  const lockedCommunity: SubCommunitySlug | undefined = isSubCommunitySlug(communityParam)
    ? communityParam
    : undefined
  const lockedAge: AgeGroupSlug | undefined = isAgeGroupSlug(ageParam) ? ageParam : undefined
  const lockedSubCommunity = lockedCommunity
    ? SUB_COMMUNITY_BY_SLUG[lockedCommunity].label
    : undefined
  const lockedChurchGroup = lockedCommunity
    ? SUB_COMMUNITY_BY_SLUG[lockedCommunity].churchGroup
    : undefined
  const lockedAgeGroup = lockedAge ? AGE_GROUP_BY_SLUG[lockedAge].label : undefined

  const { addMember } = useMembers()
  const { toast } = useToast()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const en = locale === "en"

  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("personal")

  // Sefer list (drives church group derivation)
  const [sefers, setSefers] = useState<Sefer[]>([])

  // Family linking (local — not part of the member payload)
  const [familyMode, setFamilyMode] = useState<FamilyMode>("none")
  const [familyId, setFamilyId] = useState<string>("")
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [familyRole, setFamilyRole] = useState<FamilyRole | "">("")
  const [newFamilyName, setNewFamilyName] = useState("")
  const [familySearchQuery, setFamilySearchQuery] = useState("")
  const [familyResults, setFamilyResults] = useState<Family[]>([])
  const [familySearching, setFamilySearching] = useState(false)

  // Family quick-edit dialog
  const [familyEditOpen, setFamilyEditOpen] = useState(false)
  const [editMemberQuery, setEditMemberQuery] = useState("")
  const [editMemberResults, setEditMemberResults] = useState<any[]>([])
  const [editMemberSearching, setEditMemberSearching] = useState(false)
  const [editAddRole, setEditAddRole] = useState<FamilyRole>("child")
  const [familyEditBusy, setFamilyEditBusy] = useState(false)

  const [formData, setFormData] = useState<Partial<Member>>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "", // partial ETHIOPIAN date: "2015" | "2015-04" | "2015-04-11"
    gender: "Male",
    nationality: "ethiopian",
    photoUrl: "",
    membershipNumber: `MEM-${Date.now()}`,
    registrationDate: new Date().toISOString().split("T")[0],
    woreda: "",
    seferId: "",
    sefer: "",
    subCommunity: undefined,
    emergencyContactName: "",
    emergencyContactPhone: "",
    salvationYearEthiopian: "",
    baptismYearEthiopian: "",
    catechesisStatus: "Not Started",
    isTransfer: false,
    transferFromChurch: "",
    transferDate: "",
    transferLetterUrl: "",
    currentServices: [],
    maritalStatus: "Unmarried",
    numberOfChildren: 0,
    educationLevel: undefined,
    jobType: undefined,
    profession: "",
    paysTithe: "unknown",
    titheAmount: 0,
    titheFrequency: "Monthly",
    joinDate: new Date().toISOString().split("T")[0],
    membershipStatus: "Active",
    membershipType: "Regular",
    notes: "",
  })

  // ------------------------------------------------------------------ data

  useEffect(() => {
    getSefers()
      .then((data) => setSefers(data.filter((s) => s.isActive)))
      .catch((err) => {
        console.error("Failed to load sefers:", err)
        toast({
          title: en ? "Could not load sefers" : "ሰፈሮችን መጫን አልተቻለም",
          description: en ? "Please refresh and try again" : "እባክዎ ገጹን አድሱ",
          variant: "destructive",
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableSefers = useMemo(() => {
    if (!lockedChurchGroup) return sefers
    return sefers.filter((s) => s.churchGroup === lockedChurchGroup)
  }, [sefers, lockedChurchGroup])

  // Lock church group when creating from a sub-community page.
  useEffect(() => {
    if (!lockedSubCommunity) return
    setFormData((prev) => {
      if (prev.subCommunity === lockedSubCommunity) return prev
      return { ...prev, subCommunity: lockedSubCommunity }
    })
  }, [lockedSubCommunity])

  // Prefill age group when creating from Youth/Children pages.
  useEffect(() => {
    if (!lockedAgeGroup) return
    setFormData((prev) => {
      if (prev.ageGroup === lockedAgeGroup) return prev
      return { ...prev, ageGroup: lockedAgeGroup }
    })
  }, [lockedAgeGroup])

  // If the selected sefer no longer belongs to the locked community, clear it.
  useEffect(() => {
    if (!lockedChurchGroup || !formData.seferId) return
    const selected = sefers.find((s) => s._id === formData.seferId)
    if (selected && selected.churchGroup !== lockedChurchGroup) {
      setFormData((prev) => ({
        ...prev,
        seferId: "",
        sefer: "",
        subCommunity: lockedSubCommunity,
      }))
    }
  }, [lockedChurchGroup, lockedSubCommunity, formData.seferId, sefers])

  // Age group derived from the EC birth date
  const age = ageFromEcPartial(formData.dateOfBirth)
  useEffect(() => {
    if (age === undefined) return
    let ageGroup: Member["ageGroup"]
    if (age <= 13) ageGroup = "Children"
    else if (age <= 18) ageGroup = "Teenagers"
    else if (age <= 30) ageGroup = "Youth"
    else if (age <= 50) ageGroup = "Adults"
    else ageGroup = "Seniors"
    setFormData((prev) => (prev.ageGroup === ageGroup ? prev : { ...prev, ageGroup }))
  }, [age])

  // Debounced family search
  useEffect(() => {
    if (familyMode !== "existing") return
    const q = familySearchQuery.trim()
    if (!q) {
      setFamilyResults([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        setFamilySearching(true)
        const res = await searchFamilies(q)
        setFamilyResults(res.data)
      } catch (err) {
        console.error("Family search failed:", err)
        setFamilyResults([])
      } finally {
        setFamilySearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [familySearchQuery, familyMode])

  // Keep the selected family's details fresh (drives emergency-contact options + edit dialog)
  const refreshSelectedFamily = useCallback(async (id: string) => {
    try {
      const fam = await getFamily(id)
      setSelectedFamily(fam)
    } catch (err) {
      console.error("Failed to load family:", err)
    }
  }, [])

  useEffect(() => {
    if (familyMode === "existing" && familyId) {
      refreshSelectedFamily(familyId)
    } else {
      setSelectedFamily(null)
    }
  }, [familyId, familyMode, refreshSelectedFamily])

  // Debounced member search for the family-edit dialog
  useEffect(() => {
    if (!familyEditOpen) return
    const q = editMemberQuery.trim()
    if (!q) {
      setEditMemberResults([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        setEditMemberSearching(true)
        const results = await searchMembers(q, 8)
        setEditMemberResults(results)
      } catch {
        setEditMemberResults([])
      } finally {
        setEditMemberSearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [editMemberQuery, familyEditOpen])

  // -------------------------------------------------------------- scrollspy

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id as SectionId)
      },
      { rootMargin: "-100px 0px -55% 0px" },
    )
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // ---------------------------------------------------------------- handlers

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSeferChange = (seferId: string) => {
    const sefer = availableSefers.find((s) => s._id === seferId)
    setFormData((prev) => ({
      ...prev,
      seferId,
      sefer: sefer?.name || "",
      subCommunity: lockedSubCommunity
        ? lockedSubCommunity
        : sefer
          ? CHURCH_GROUP_TO_SUB_COMMUNITY[sefer.churchGroup]
          : undefined,
    }))
  }

  const servicesFull = (formData.currentServices || []).length >= 2
  const toggleService = (value: string) => {
    setFormData((prev) => {
      const current = prev.currentServices || []
      if (current.includes(value)) {
        return { ...prev, currentServices: current.filter((item) => item !== value) }
      }
      if (current.length >= 2) return prev
      return { ...prev, currentServices: [...current, value] }
    })
  }

  const useFamilyMemberAsEmergency = (memberId: string) => {
    if (!selectedFamily) return
    const entry = selectedFamily.members.find((m) => memberInfoOf(m)._id === memberId)
    if (!entry) return
    const info = memberInfoOf(entry)
    setFormData((prev) => ({
      ...prev,
      emergencyContactName: info.fullName || prev.emergencyContactName,
      emergencyContactPhone: (info as any).phoneNumber || prev.emergencyContactPhone,
    }))
  }

  const validate = (): boolean => {
    const fail = (title: string, description: string) => {
      toast({ title, description, variant: "destructive" })
      scrollTo("personal")
      return false
    }
    if (!formData.firstName || !formData.middleName || !formData.phone) {
      return fail(en ? "Required fields missing" : "አስፈላጊ መስኮች ይጎድላሉ", t.memberForm.requiredFields)
    }
    if (formData.phone && formData.phone.length < 9) {
      return fail(
        en ? "Invalid phone number" : "ልክ ያልሆነ ስልክ ቁጥር",
        en ? "Please enter a valid phone number" : "እባክዎ ልክ ያለ ስልክ ቁጥር ያስገቡ",
      )
    }
    if (!formData.dateOfBirth) {
      return fail(
        en ? "Date of birth required" : "የትውልድ ቀን ያስፈልጋል",
        en ? "At least the year of birth (EC) is required" : "ቢያንስ የትውልድ ዓመት (ዓ.ም) ያስፈልጋል",
      )
    }
    if (!formData.seferId) {
      return fail(en ? "Sefer required" : "ሰፈር ያስፈልጋል", en ? "Please select a sefer" : "እባክዎ ሰፈር ይምረጡ")
    }
    if (familyMode !== "none" && !familyRole) {
      toast({
        title: en ? "Family role missing" : "የቤተሰብ ሚና ይጎድላል",
        description: en ? "Select the member's role in the family" : "የአባሉን የቤተሰብ ሚና ይምረጡ",
        variant: "destructive",
      })
      scrollTo("service-family")
      return false
    }
    return true
  }

  const openConfirm = () => {
    if (validate()) setConfirmOpen(true)
  }

  async function linkFamily(memberId: string) {
    if (familyMode === "existing" && familyId && familyRole) {
      await addFamilyMember(familyId, memberId, familyRole)
    } else if (familyMode === "new" && familyRole) {
      await createFamily({
        name: newFamilyName.trim() || undefined,
        members: [{ memberId, role: familyRole }],
      })
    }
  }

  async function submit() {
    setLoading(true)
    try {
      const memberData = {
        ...formData,
        firstName: formData.firstName!,
        phone: formData.phone!,
        gender: formData.gender!,
        maritalStatus: formData.maritalStatus!,
        isTransfer: formData.isTransfer!,
        currentServices: formData.currentServices || [],
        numberOfChildren: familyMode === "existing" ? 0 : formData.numberOfChildren || 0,
        paysTithe: formData.paysTithe!,
        joinDate: formData.joinDate!,
        membershipStatus: formData.membershipStatus!,
        subCommunity: lockedSubCommunity || formData.subCommunity,
      } as Omit<Member, "id" | "createdAt" | "updatedAt">

      const created = await addMember(memberData)

      // Optional family linking. A failure here must NOT fail member creation.
      if (familyMode !== "none" && familyRole) {
        try {
          await linkFamily(created.id)
        } catch (familyError) {
          console.error("Family linking failed:", familyError)
          toast({
            title: en ? "Member created, family not linked" : "አባል ተፈጥሯል፣ ቤተሰብ አልተገናኘም",
            description: en
              ? "The member was saved but linking to the family failed. You can link them later."
              : "አባሉ ተቀምጧል ነገር ግን ከቤተሰቡ ጋር ማገናኘት አልተሳካም። በኋላ ማገናኘት ይችላሉ።",
            variant: "destructive",
          })
        }
      }

      toast({
        title: t.memberForm.createSuccess,
        description: `${formData.firstName} ${formData.middleName ?? ""} ${
          en ? "has been added to the system" : "ወደ ስርዓቱ ታክሏል"
        }`,
      })
      router.push(
        lockedCommunity
          ? subCommunityHref(lockedCommunity)
          : lockedAge
            ? ageGroupHref(lockedAge)
            : "/members",
      )
    } catch (error) {
      console.error("Error creating member:", error)
      setConfirmOpen(false)
      toast({
        title: t.memberForm.createError,
        description: error instanceof Error ? error.message : en ? "Please try again" : "እባክዎ እንደገና ይሞክሩ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Family edit dialog actions
  const handleEditAddMember = async (memberId: string) => {
    if (!familyId) return
    try {
      setFamilyEditBusy(true)
      await addFamilyMember(familyId, memberId, editAddRole)
      await refreshSelectedFamily(familyId)
      setEditMemberQuery("")
      setEditMemberResults([])
    } catch (err) {
      toast({
        title: en ? "Could not add member" : "አባል ማከል አልተቻለም",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setFamilyEditBusy(false)
    }
  }

  const handleEditRemoveMember = async (memberId: string) => {
    if (!familyId) return
    try {
      setFamilyEditBusy(true)
      await removeFamilyMember(familyId, memberId)
      await refreshSelectedFamily(familyId)
    } catch (err) {
      toast({
        title: en ? "Could not remove member" : "አባል ማስወገድ አልተቻለም",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setFamilyEditBusy(false)
    }
  }

  // ------------------------------------------------------------------ static

  const sections: { id: SectionId; title: string; icon: React.ElementType }[] = [
    { id: "personal", title: en ? "Personal" : "የግል መረጃ", icon: User },
    { id: "spiritual", title: en ? "Spiritual" : "መንፈሳዊ", icon: Heart },
    { id: "service-family", title: en ? "Service & Family" : "አገልግሎት እና ቤተሰብ", icon: Home },
    { id: "education-tithe", title: en ? "Education & Tithe" : "ትምህርት እና አስራት", icon: Wallet },
  ]

  const serviceOptions = [
    { value: "Choir", label: t.services.choir },
    { value: "Youth Ministry", label: t.services.youthMinistry },
    { value: "Sunday School", label: t.services.sundaySchool },
    { value: "Media Team", label: t.services.mediaTeam },
    { value: "Ushering", label: t.services.ushering },
    { value: "Prayer Team", label: t.services.prayerTeam },
    { value: "Worship", label: t.services.worship },
    { value: "Teaching", label: t.services.teaching },
  ]

  const familyRoleOptions: { value: FamilyRole; label: string }[] = [
    { value: "father", label: t.family.roles.father },
    { value: "mother", label: t.family.roles.mother },
    { value: "child", label: t.family.roles.child },
    { value: "sibling", label: t.family.roles.sibling },
    { value: "spouse", label: t.family.roles.spouse },
    { value: "other", label: t.family.roles.other },
  ]

  const derivedChurchGroup = formData.subCommunity

  const NextButton = ({ to }: { to: SectionId }) => (
    <div className="flex justify-end border-t pt-3">
      <Button type="button" variant="ghost" size="sm" onClick={() => scrollTo(to)} className="gap-1.5 text-primary">
        {t.common.next}
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  const summaryRows: { label: string; value: React.ReactNode }[] = [
    {
      label: en ? "Full name" : "ሙሉ ስም",
      value: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" "),
    },
    { label: en ? "Phone" : "ስልክ", value: formData.phone },
    { label: en ? "Sex" : "ጾታ", value: formData.gender === "Male" ? (en ? "Male" : "ወንድ") : en ? "Female" : "ሴት" },
    {
      label: en ? "Date of birth (EC)" : "የትውልድ ቀን (ዓ.ም)",
      value: `${formatFlexibleDate(formData.dateOfBirth, locale)}${age !== undefined ? ` · ${age} ${en ? "yrs" : "ዓመት"}` : ""}`,
    },
    { label: en ? "Sefer / Group" : "ሰፈር / ቡድን", value: `${formData.sefer || "—"} / ${derivedChurchGroup || "—"}` },
    { label: en ? "Woreda" : "ወረዳ", value: formData.woreda || "—" },
    {
      label: en ? "Salvation (EC)" : "ደኅንነት (ዓ.ም)",
      value: formatFlexibleDate(formData.salvationYearEthiopian, locale) || "—",
    },
    {
      label: en ? "Baptism (EC)" : "ጥምቀት (ዓ.ም)",
      value: formatFlexibleDate(formData.baptismYearEthiopian, locale) || "—",
    },
    {
      label: en ? "Transfer" : "ዝውውር",
      value: formData.isTransfer ? `${t.common.yes}${formData.transferFromChurch ? ` · ${formData.transferFromChurch}` : ""}` : t.common.no,
    },
    {
      label: en ? "Serving at" : "አገልግሎት",
      value: (formData.currentServices || []).length ? (formData.currentServices || []).join(", ") : "—",
    },
    {
      label: en ? "Family" : "ቤተሰብ",
      value:
        familyMode === "none"
          ? "—"
          : familyMode === "existing"
            ? `${selectedFamily?.name || t.family.unnamedFamily} · ${familyRole ? t.family.roles[familyRole] : ""}`
            : `${en ? "New:" : "አዲስ:"} ${newFamilyName || t.family.unnamedFamily} · ${familyRole ? t.family.roles[familyRole] : ""}`,
    },
    {
      label: en ? "Pays tithe" : "አስራት",
      value:
        formData.paysTithe === "yes"
          ? `${t.common.yes} · ${formData.titheAmount} Birr / ${formData.titheFrequency}`
          : formData.paysTithe === "no"
            ? t.common.no
            : t.common.unknown,
    },
  ]

  // ------------------------------------------------------------------ render

  return (
    <div className="bg-background">
      {/*
        No inner scroll container here: the dashboard layout's <main> is the
        real scrolling ancestor. An `overflow-y-auto` wrapper here would make
        this div its own (never-overflowing) scroll container, which breaks
        `sticky` below — it would stop tracking the page's actual scroll.
      */}
      {/* Sticky header with free section navigation */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <h1 className="hidden text-base font-semibold md:block">{t.memberForm.createTitle}</h1>
          <nav className="flex items-center gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <s.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </nav>
          <Button type="button" size="sm" onClick={openConfirm} disabled={loading} className="gap-1.5">
            {en ? "Create Member" : "አባል ይፍጠሩ"}
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
        <p className="text-xs text-muted-foreground">
          {en
            ? "All dates are in the Ethiopian calendar (ዓ.ም). Fields marked * are required — everything else can be completed later."
            : "ሁሉም ቀኖች በኢትዮጵያ ዘመን አቆጣጠር (ዓ.ም) ናቸው። በ * ምልክት የተደረገባቸው መስኮች አስፈላጊ ናቸው።"}
        </p>

        {/* ============ PERSONAL ============ */}
        <Card id="personal" className="scroll-mt-16">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              {en ? "Personal" : "የግል መረጃ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={en ? "Name" : "ስም"} htmlFor="firstName" required>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="h-9" />
              </Field>
              <Field label={en ? "Father's Name" : "የአባት ስም"} htmlFor="middleName" required>
                <Input id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} className="h-9" />
              </Field>
              <Field label={en ? "Grandfather's Name" : "የአያት ስም"} htmlFor="lastName">
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="h-9" />
              </Field>
              <Field label={en ? "Sex" : "ጾታ"} htmlFor="gender">
                <Select value={formData.gender} onValueChange={(v) => handleSelectChange("gender", v)}>
                  <SelectTrigger id="gender" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{en ? "Male" : "ወንድ"}</SelectItem>
                    <SelectItem value="Female">{en ? "Female" : "ሴት"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={en ? "Phone Number" : "ስልክ ቁጥር"} htmlFor="phone" required>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="09..." className="h-9" />
              </Field>
              <Field
                label={
                  <>
                    {en ? "Date of Birth (ዓ.ም)" : "የትውልድ ቀን (ዓ.ም)"}{" "}
                    <span className="normal-case text-muted-foreground/70">
                      {en ? "· month & day optional" : "· ወር እና ቀን አማራጭ"}
                    </span>
                  </>
                }
                htmlFor="dateOfBirth"
                required
              >
                <div className="flex items-center gap-2">
                  <FlexibleDateInput
                    id="dateOfBirth"
                    locale={locale}
                    value={formData.dateOfBirth}
                    onChange={(v) => setFormData((prev) => ({ ...prev, dateOfBirth: v }))}
                  />
                  {age !== undefined && formData.dateOfBirth && (
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {age} {en ? "yrs" : "ዓመት"}
                    </Badge>
                  )}
                </div>
              </Field>
              <Field label={t.basicInfo.nationality} htmlFor="nationality">
                <Select value={formData.nationality} onValueChange={(v) => handleSelectChange("nationality", v)}>
                  <SelectTrigger id="nationality" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethiopian">{en ? "Ethiopian" : "ኢትዮጵያዊ"}</SelectItem>
                    <SelectItem value="non_ethiopian">{en ? "Non-Ethiopian" : "ኢትዮጵያዊ ያልሆነ"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.basicInfo.maritalStatus} htmlFor="maritalStatus">
                <Select value={formData.maritalStatus} onValueChange={(v) => handleSelectChange("maritalStatus", v)}>
                  <SelectTrigger id="maritalStatus" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unmarried">{en ? "Unmarried" : "ያላገባ"}</SelectItem>
                    <SelectItem value="Married">{en ? "Married" : "ያገባ"}</SelectItem>
                    <SelectItem value="Divorced">{en ? "Divorced" : "የተፋታ"}</SelectItem>
                    <SelectItem value="Widowed">{en ? "Widowed" : "ባል/ሚስት የሞተባቸው"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.basicInfo.woreda} htmlFor="woreda">
                <Input id="woreda" name="woreda" value={formData.woreda} onChange={handleChange} className="h-9" />
              </Field>
              <Field label={en ? "Sefer" : "ሰፈር"} htmlFor="sefer" required>
                <Select value={formData.seferId || ""} onValueChange={handleSeferChange}>
                  <SelectTrigger id="sefer" className="h-9">
                    <SelectValue placeholder={en ? "Select sefer" : "ሰፈር ይምረጡ"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSefers.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {locale === "am" && s.nameAmharic ? s.nameAmharic : s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.basicInfo.churchGroup}>
                <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm">
                  {lockedSubCommunity || derivedChurchGroup || (
                    <span className="text-muted-foreground">{en ? "Derived from sefer" : "ከሰፈር የሚወሰን"}</span>
                  )}
                </div>
              </Field>
              <Field label={t.basicInfo.membershipType} htmlFor="membershipType">
                <Select value={formData.membershipType} onValueChange={(v) => handleSelectChange("membershipType", v)}>
                  <SelectTrigger id="membershipType" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">{en ? "Regular" : "መደበኛ"}</SelectItem>
                    <SelectItem value="Guest">{en ? "Guest" : "እንግዳ"}</SelectItem>
                    <SelectItem value="Transferred">{en ? "Transferred" : "በዝውውር"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <NextButton to="spiritual" />
          </CardContent>
        </Card>

        {/* ============ SPIRITUAL ============ */}
        <Card id="spiritual" className="scroll-mt-16">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-primary" />
              {en ? "Spiritual Journey & Transfer" : "መንፈሳዊ ጉዞ እና ዝውውር"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t.spiritualJourney.salvationYearEthiopian} htmlFor="salvationYearEthiopian">
                <FlexibleDateInput
                  id="salvationYearEthiopian"
                  locale={locale}
                  value={formData.salvationYearEthiopian}
                  onChange={(v) => setFormData((prev) => ({ ...prev, salvationYearEthiopian: v }))}
                />
              </Field>
              <Field label={t.spiritualJourney.baptismYearEthiopian} htmlFor="baptismYearEthiopian">
                <FlexibleDateInput
                  id="baptismYearEthiopian"
                  locale={locale}
                  value={formData.baptismYearEthiopian}
                  onChange={(v) => setFormData((prev) => ({ ...prev, baptismYearEthiopian: v }))}
                />
              </Field>
              <Field label={t.spiritualJourney.discipleshipStatus} htmlFor="catechesisStatus">
                <Select value={formData.catechesisStatus} onValueChange={(v) => handleSelectChange("catechesisStatus", v)}>
                  <SelectTrigger id="catechesisStatus" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">{en ? "Not Started" : "ያልጀመረ"}</SelectItem>
                    <SelectItem value="In Progress">{en ? "In Progress" : "በሂደት ላይ"}</SelectItem>
                    <SelectItem value="Completed">{en ? "Completed" : "ያጠናቀቀ"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-2.5">
              <SubHeading>{t.transferInfo.isTransfer}</SubHeading>
              <div className="flex flex-wrap items-center gap-4">
                <RadioGroup
                  value={formData.isTransfer ? "yes" : "no"}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, isTransfer: v === "yes" }))}
                  className="flex gap-4"
                >
                  <label htmlFor="transfer-yes" className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="yes" id="transfer-yes" />
                    {t.common.yes}
                  </label>
                  <label htmlFor="transfer-no" className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="no" id="transfer-no" />
                    {t.common.no}
                  </label>
                </RadioGroup>
              </div>

              {formData.isTransfer && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={t.transferInfo.transferFromChurch} htmlFor="transferFromChurch">
                    <Input
                      id="transferFromChurch"
                      name="transferFromChurch"
                      value={formData.transferFromChurch}
                      onChange={handleChange}
                      className="h-9"
                    />
                  </Field>
                  <Field label={`${t.transferInfo.transferDate} (ዓ.ም)`} htmlFor="transferDate">
                    <FlexibleDateInput
                      id="transferDate"
                      locale={locale}
                      value={formData.transferDate}
                      onChange={(v) => setFormData((prev) => ({ ...prev, transferDate: v }))}
                    />
                  </Field>
                  <Field label={t.transferInfo.transferLetter} htmlFor="transferLetter">
                    <Input id="transferLetter" type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="h-9 pt-1.5" />
                  </Field>
                </div>
              )}
            </div>
            <NextButton to="service-family" />
          </CardContent>
        </Card>

        {/* ============ SERVICE & FAMILY ============ */}
        <Card id="service-family" className="scroll-mt-16">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-primary" />
              {en ? "Service & Family" : "አገልግሎት እና ቤተሰብ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <SubHeading>
                {t.serviceMinistry.currentServices} ·{" "}
                {en ? `${(formData.currentServices || []).length}/2 selected` : `${(formData.currentServices || []).length}/2 ተመርጧል`}
              </SubHeading>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((service) => {
                  const checked = (formData.currentServices || []).includes(service.value)
                  const disabled = !checked && servicesFull
                  return (
                    <button
                      key={service.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleService(service.value)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 text-primary"
                          : disabled
                            ? "cursor-not-allowed border-border text-muted-foreground/40"
                            : "border-border hover:bg-muted"
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                      {service.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <SubHeading>{en ? "Family" : "ቤተሰብ"}</SubHeading>
              <p className="text-xs text-muted-foreground">{t.family.linkNote}</p>
              <RadioGroup
                value={familyMode}
                onValueChange={(value) => {
                  setFamilyMode(value as FamilyMode)
                  setFamilyId("")
                  setFamilyResults([])
                }}
                className="grid grid-cols-3 gap-2"
              >
                {(
                  [
                    { v: "none", label: t.family.noFamily },
                    { v: "existing", label: t.family.existingFamily },
                    { v: "new", label: t.family.newFamily },
                  ] as { v: FamilyMode; label: string }[]
                ).map(({ v, label }) => (
                  <label
                    key={v}
                    htmlFor={`family-${v}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                      familyMode === v ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={v} id={`family-${v}`} />
                    {label}
                  </label>
                ))}
              </RadioGroup>

              {familyMode === "existing" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={familySearchQuery}
                      onChange={(e) => setFamilySearchQuery(e.target.value)}
                      className="h-9 pl-9"
                      placeholder={t.family.searchPlaceholder}
                    />
                    {familySearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <div className="max-h-52 space-y-1.5 overflow-y-auto">
                    {familyResults.length === 0 && familySearchQuery.trim() && !familySearching && (
                      <p className="text-xs text-muted-foreground">{t.family.noFamiliesFound}</p>
                    )}
                    {familyResults.map((family) => {
                      const isSelected = familyId === family._id
                      return (
                        <button
                          type="button"
                          key={family._id}
                          onClick={() => setFamilyId(family._id)}
                          className={`w-full rounded-md border p-2.5 text-left text-sm transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{family.name || t.family.unnamedFamily}</span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {family.members.map((m, i) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal">
                                {memberInfoOf(m).fullName} · {t.family.roles[m.role]}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedFamily && (
                    <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
                      <span className="text-sm">
                        {en ? "Selected:" : "የተመረጠ:"}{" "}
                        <span className="font-medium">{selectedFamily.name || t.family.unnamedFamily}</span>{" "}
                        <span className="text-muted-foreground">
                          · {selectedFamily.members.length} {en ? "members" : "አባላት"}
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5"
                        onClick={() => setFamilyEditOpen(true)}
                      >
                        <Pencil className="h-3 w-3" />
                        {en ? "Edit family" : "ቤተሰብ አርትዕ"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {familyMode === "new" && (
                <Field label={t.family.familyName} htmlFor="newFamilyName">
                  <Input
                    id="newFamilyName"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder={en ? "e.g. Abebe Family" : "ለምሳሌ የአበበ ቤተሰብ"}
                    className="h-9"
                  />
                </Field>
              )}

              {familyMode !== "none" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={en ? "Role in family" : "በቤተሰብ ውስጥ ያለ ሚና"} htmlFor="familyRole" required>
                    <Select value={familyRole} onValueChange={(value) => setFamilyRole(value as FamilyRole)}>
                      <SelectTrigger id="familyRole" className="h-9">
                        <SelectValue placeholder={en ? "Select role" : "ሚና ይምረጡ"} />
                      </SelectTrigger>
                      <SelectContent>
                        {familyRoleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {familyMode !== "existing" && (
                    <Field label={t.family.numberOfChildren} htmlFor="numberOfChildren">
                      <Input
                        id="numberOfChildren"
                        name="numberOfChildren"
                        type="number"
                        min={0}
                        value={formData.numberOfChildren}
                        onChange={handleChange}
                        className="h-9"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <SubHeading>
                <span className="flex items-center gap-1.5">
                  <ContactRound className="h-3.5 w-3.5" />
                  {en ? "Emergency Contact" : "የድንገተኛ ጊዜ ተጠሪ"}
                </span>
              </SubHeading>
              {selectedFamily && selectedFamily.members.length > 0 && (
                <Field label={en ? "Use a family member" : "የቤተሰብ አባል ይጠቀሙ"}>
                  <Select onValueChange={useFamilyMemberAsEmergency}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={en ? "Pick from family…" : "ከቤተሰብ ይምረጡ…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFamily.members.map((m) => {
                        const info = memberInfoOf(m)
                        return (
                          <SelectItem key={info._id} value={info._id}>
                            {info.fullName} · {t.family.roles[m.role]}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.basicInfo.emergencyContactName} htmlFor="emergencyContactName">
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="h-9"
                  />
                </Field>
                <Field label={t.basicInfo.emergencyContactPhone} htmlFor="emergencyContactPhone">
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="h-9"
                  />
                </Field>
              </div>
            </div>

            <Field label={t.family.additionalNotes} htmlFor="notes">
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} />
            </Field>
            <NextButton to="education-tithe" />
          </CardContent>
        </Card>

        {/* ============ EDUCATION & TITHE ============ */}
        <Card id="education-tithe" className="scroll-mt-16">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              {en ? "Education & Tithe" : "ትምህርት እና አስራት"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t.education.educationLevel} htmlFor="educationLevel">
                <Select value={formData.educationLevel || ""} onValueChange={(v) => handleSelectChange("educationLevel", v)}>
                  <SelectTrigger id="educationLevel" className="h-9">
                    <SelectValue placeholder={en ? "Select" : "ይምረጡ"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uneducated">{en ? "Uneducated" : "ያልተማረ"}</SelectItem>
                    <SelectItem value="1-8">1-8</SelectItem>
                    <SelectItem value="9-12">9-12</SelectItem>
                    <SelectItem value="Finished 12">{en ? "Finished 12" : "12ኛ ያጠናቀቀ"}</SelectItem>
                    <SelectItem value="Diploma">{en ? "Diploma" : "ዲፕሎማ"}</SelectItem>
                    <SelectItem value="Degree">{en ? "Degree" : "ዲግሪ"}</SelectItem>
                    <SelectItem value="Masters">{en ? "Masters" : "ማስተርስ"}</SelectItem>
                    <SelectItem value="PhD">{en ? "PhD" : "ፒኤችዲ"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.education.jobType} htmlFor="jobType">
                <Select value={formData.jobType || ""} onValueChange={(v) => handleSelectChange("jobType", v)}>
                  <SelectTrigger id="jobType" className="h-9">
                    <SelectValue placeholder={en ? "Select" : "ይምረጡ"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">{en ? "Self-employed" : "የግል ሥራ"}</SelectItem>
                    <SelectItem value="Government">{en ? "Government" : "የመንግስት"}</SelectItem>
                    <SelectItem value="Private">{en ? "Private" : "የግል ድርጅት"}</SelectItem>
                    <SelectItem value="Unemployed">{en ? "Unemployed" : "ሥራ አጥ"}</SelectItem>
                    <SelectItem value="Student">{en ? "Student" : "ተማሪ"}</SelectItem>
                    <SelectItem value="Retired">{en ? "Retired" : "ጡረተኛ"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.education.profession} htmlFor="profession">
                <Input
                  id="profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder={en ? "e.g. Teacher" : "ለምሳሌ መምህር"}
                  className="h-9"
                />
              </Field>
            </div>

            <div className="space-y-2.5">
              <SubHeading>{t.financial.paysTithe}</SubHeading>
              <RadioGroup
                value={formData.paysTithe}
                onValueChange={(v) => handleSelectChange("paysTithe", v)}
                className="flex flex-wrap gap-4"
              >
                <label htmlFor="tithe-yes" className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="yes" id="tithe-yes" />
                  {t.common.yes}
                </label>
                <label htmlFor="tithe-no" className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="no" id="tithe-no" />
                  {t.common.no}
                </label>
                <label htmlFor="tithe-unknown" className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="unknown" id="tithe-unknown" />
                  {t.common.unknown}
                </label>
              </RadioGroup>

              {formData.paysTithe === "yes" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t.financial.titheAmountInBirr} htmlFor="titheAmount">
                    <Input
                      id="titheAmount"
                      name="titheAmount"
                      type="number"
                      min={0}
                      value={formData.titheAmount}
                      onChange={handleChange}
                      className="h-9"
                    />
                  </Field>
                  <Field label={t.financial.titheFrequency} htmlFor="titheFrequency">
                    <Select value={formData.titheFrequency} onValueChange={(v) => handleSelectChange("titheFrequency", v)}>
                      <SelectTrigger id="titheFrequency" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">{t.frequency.weekly}</SelectItem>
                        <SelectItem value="Monthly">{t.frequency.monthly}</SelectItem>
                        <SelectItem value="Occasionally">{t.frequency.occasionally}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button type="button" onClick={openConfirm} disabled={loading} className="gap-1.5">
                {en ? "Create Member" : "አባል ይፍጠሩ"}
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <FloatingStepNav sections={sections} activeSection={activeSection} onNavigate={scrollTo} />

      {/* ============ CONFIRMATION DIALOG ============ */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{en ? "Confirm new member" : "አዲስ አባል ያረጋግጡ"}</DialogTitle>
            <DialogDescription>
              {en ? "Please check that all details are correct before creating." : "ከመፍጠርዎ በፊት ሁሉም ዝርዝሮች ትክክል መሆናቸውን ያረጋግጡ።"}
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border rounded-md border border-border text-sm">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 px-3 py-1.5">
                <span className="shrink-0 text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium">{row.value || "—"}</span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
              {en ? "Go back & edit" : "ተመልሰው ያርሙ"}
            </Button>
            <Button type="button" onClick={submit} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {loading ? t.common.saving : en ? "Create Member" : "አባል ይፍጠሩ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ FAMILY QUICK-EDIT DIALOG ============ */}
      <Dialog open={familyEditOpen} onOpenChange={setFamilyEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {en ? "Edit family" : "ቤተሰብ አርትዕ"} — {selectedFamily?.name || t.family.unnamedFamily}
            </DialogTitle>
            <DialogDescription>
              {en ? "Add or remove members of this family." : "የዚህን ቤተሰብ አባላት ያክሉ ወይም ያስወግዱ።"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            {selectedFamily?.members.map((m) => {
              const info = memberInfoOf(m)
              return (
                <div key={info._id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>
                    {info.fullName} <span className="text-muted-foreground">· {t.family.roles[m.role]}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={familyEditBusy}
                    onClick={() => handleEditRemoveMember(info._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              {en ? "Add existing member" : "ነባር አባል ያክሉ"}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={editMemberQuery}
                  onChange={(e) => setEditMemberQuery(e.target.value)}
                  className="h-9 pl-9"
                  placeholder={en ? "Search members…" : "አባላት ይፈልጉ…"}
                />
                {editMemberSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <Select value={editAddRole} onValueChange={(v) => setEditAddRole(v as FamilyRole)}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {familyRoleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editMemberResults.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {editMemberResults
                  .filter((r) => !selectedFamily?.members.some((m) => memberInfoOf(m)._id === (r._id || r.id)))
                  .map((r) => (
                    <button
                      key={r._id || r.id}
                      type="button"
                      disabled={familyEditBusy}
                      onClick={() => handleEditAddMember(r._id || r.id)}
                      className="flex w-full items-center justify-between rounded-md border border-border px-3 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <span>{r.fullName}</span>
                      <UserPlus className="h-3.5 w-3.5 text-primary" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setFamilyEditOpen(false)}>
              {en ? "Done" : "ተጠናቋል"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
