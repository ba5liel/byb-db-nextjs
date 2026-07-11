"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Heart,
  Home,
  Wallet,
  Check,
  Search,
  Loader2,
} from "lucide-react"
import { useMembers } from "@/lib/members-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { EthiopianYearInput } from "@/components/ethiopian-date-input"
import { FlexibleDateInput } from "@/components/flexible-date-input"
import { getSefers } from "@/lib/sefers-api"
import { searchFamilies, createFamily, addFamilyMember } from "@/lib/families-api"
import type { Member, Sefer, Family, FamilyRole, SubCommunity } from "@/lib/types"

const CHURCH_GROUP_TO_SUB_COMMUNITY: Record<string, SubCommunity> = {
  jemmo: "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alpha: "Alpha",
}

type FamilyMode = "none" | "existing" | "new"

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

/** Small uppercase section heading inside a step. */
function Section({
  title,
  children,
  columns = 3,
}: {
  title: string
  children: React.ReactNode
  columns?: 1 | 2 | 3
}) {
  const grid =
    columns === 1
      ? "grid gap-3"
      : columns === 2
        ? "grid gap-3 sm:grid-cols-2"
        : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className={grid}>{children}</div>
    </div>
  )
}

export default function NewMemberPage() {
  const router = useRouter()
  const { addMember } = useMembers()
  const { toast } = useToast()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const en = locale === "en"

  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Sefer list (drives church group derivation)
  const [sefers, setSefers] = useState<Sefer[]>([])

  // Family linking (local — not part of the member payload)
  const [familyMode, setFamilyMode] = useState<FamilyMode>("none")
  const [familyId, setFamilyId] = useState<string>("")
  const [familyRole, setFamilyRole] = useState<FamilyRole | "">("")
  const [newFamilyName, setNewFamilyName] = useState("")
  const [familySearchQuery, setFamilySearchQuery] = useState("")
  const [familyResults, setFamilyResults] = useState<Family[]>([])
  const [familySearching, setFamilySearching] = useState(false)

  const [formData, setFormData] = useState<Partial<Member>>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
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

  // Fetch sefers on mount
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

  // Auto-calculate age group when date of birth changes (works on partial dates too)
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth)
      let ageGroup: Member["ageGroup"]
      if (age <= 13) ageGroup = "Children"
      else if (age <= 17) ageGroup = "Teenagers"
      else if (age <= 35) ageGroup = "Youth"
      else if (age <= 65) ageGroup = "Adults"
      else ageGroup = "Seniors"

      setFormData((prev) => ({ ...prev, ageGroup }))
    }
  }, [formData.dateOfBirth])

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

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    if (Number.isNaN(birthDate.getTime())) return 0
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSeferChange = (seferId: string) => {
    const sefer = sefers.find((s) => s._id === seferId)
    setFormData((prev) => ({
      ...prev,
      seferId,
      sefer: sefer?.name || "",
      subCommunity: sefer ? CHURCH_GROUP_TO_SUB_COMMUNITY[sefer.churchGroup] : undefined,
    }))
  }

  const toggleService = (value: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.currentServices || []
      if (checked) {
        if (current.length >= 2) {
          toast({
            title: en ? "Maximum services reached" : "ከፍተኛው አገልግሎቶች ደርሰዋል",
            description: t.serviceMinistry.maxServicesReached,
            variant: "destructive",
          })
          return prev
        }
        return { ...prev, currentServices: [...current, value] }
      }
      return { ...prev, currentServices: current.filter((item) => item !== value) }
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.middleName || !formData.phone) {
          toast({
            title: en ? "Required fields missing" : "አስፈላጊ መስኮች ይጎድላሉ",
            description: t.memberForm.requiredFields,
            variant: "destructive",
          })
          return false
        }
        if (formData.phone && formData.phone.length < 9) {
          toast({
            title: en ? "Invalid phone number" : "ልክ ያልሆነ ስልክ ቁጥር",
            description: en ? "Please enter a valid phone number" : "እባክዎ ልክ ያለ ስልክ ቁጥር ያስገቡ",
            variant: "destructive",
          })
          return false
        }
        if (!formData.dateOfBirth) {
          toast({
            title: en ? "Date of birth required" : "የትውልድ ቀን ያስፈልጋል",
            description: en ? "At least the year of birth is required" : "ቢያንስ የትውልድ ዓመት ያስፈልጋል",
            variant: "destructive",
          })
          return false
        }
        if (!formData.seferId) {
          toast({
            title: en ? "Sefer required" : "ሰፈር ያስፈልጋል",
            description: en ? "Please select a sefer" : "እባክዎ ሰፈር ይምረጡ",
            variant: "destructive",
          })
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  /**
   * Guard against implicit form submission: in a form whose visible step has a
   * single text input (e.g. the old Education step), pressing Enter makes the
   * browser submit the whole form even though the submit button isn't rendered.
   * Enter now advances to the next step instead; only the explicit submit
   * button (or Enter on it, on the last step) submits.
   */
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return
    const target = e.target as HTMLElement
    if (target.tagName === "TEXTAREA") return
    if (currentStep < totalSteps) {
      e.preventDefault()
      nextStep()
    } else if (target.tagName !== "BUTTON") {
      e.preventDefault()
    }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateStep(currentStep) || !validateStep(1)) {
      return
    }

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
        numberOfChildren: formData.numberOfChildren || 0,
        paysTithe: formData.paysTithe!,
        joinDate: formData.joinDate!,
        membershipStatus: formData.membershipStatus!,
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

      router.push("/members")
    } catch (error) {
      console.error("Error creating member:", error)
      toast({
        title: t.memberForm.createError,
        description: error instanceof Error ? error.message : en ? "Please try again" : "እባክዎ እንደገና ይሞክሩ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: en ? "Personal" : "የግል መረጃ", icon: User },
    { number: 2, title: en ? "Spiritual" : "መንፈሳዊ", icon: Heart },
    { number: 3, title: en ? "Service & Family" : "አገልግሎት እና ቤተሰብ", icon: Home },
    { number: 4, title: en ? "Education & Tithe" : "ትምህርት እና አስራት", icon: Wallet },
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

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Compact header + stepper */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold">{t.memberForm.createTitle}</h1>
          <div className="mt-3 flex items-center gap-1">
            {steps.map((step, i) => {
              const isCurrent = currentStep === step.number
              const isDone = currentStep > step.number
              return (
                <React.Fragment key={step.number}>
                  {i > 0 && <div className={`h-px flex-1 ${isDone || isCurrent ? "bg-primary" : "bg-border"}`} />}
                  <button
                    type="button"
                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.number}</span>
                  </button>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
          <Card>
            <CardContent className="space-y-6 p-5">
              {/* ============ STEP 1: PERSONAL ============ */}
              {currentStep === 1 && (
                <>
                  <Section title={en ? "Personal" : "የግል መረጃ"}>
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
                          {en ? "Date of Birth" : "የትውልድ ቀን"}{" "}
                          <span className="normal-case text-muted-foreground/70">
                            {en ? "(month & day optional)" : "(ወር እና ቀን አማራጭ)"}
                          </span>
                        </>
                      }
                      htmlFor="dateOfBirth"
                      required
                    >
                      <FlexibleDateInput
                        id="dateOfBirth"
                        locale={locale}
                        value={formData.dateOfBirth}
                        onChange={(v) => setFormData((prev) => ({ ...prev, dateOfBirth: v }))}
                      />
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
                    {formData.ageGroup && formData.dateOfBirth && (
                      <div className="flex items-end pb-1">
                        <Badge variant="secondary" className="font-normal">
                          {en ? "Age group:" : "የእድሜ ክልል:"} {formData.ageGroup}
                        </Badge>
                      </div>
                    )}
                  </Section>

                  <Section title={en ? "Address & Church Group" : "አድራሻ እና የቤተክርስቲያን ቡድን"}>
                    <Field label={t.basicInfo.woreda} htmlFor="woreda">
                      <Input id="woreda" name="woreda" value={formData.woreda} onChange={handleChange} className="h-9" />
                    </Field>
                    <Field label={en ? "Sefer" : "ሰፈር"} htmlFor="sefer" required>
                      <Select value={formData.seferId || ""} onValueChange={handleSeferChange}>
                        <SelectTrigger id="sefer" className="h-9">
                          <SelectValue placeholder={en ? "Select sefer" : "ሰፈር ይምረጡ"} />
                        </SelectTrigger>
                        <SelectContent>
                          {sefers.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {locale === "am" && s.nameAmharic ? s.nameAmharic : s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t.basicInfo.churchGroup}>
                      <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm">
                        {derivedChurchGroup ?? (
                          <span className="text-muted-foreground">{en ? "From sefer" : "ከሰፈር የሚወሰን"}</span>
                        )}
                      </div>
                    </Field>
                  </Section>

                  <Section title={en ? "Emergency Contact & Membership" : "የድንገተኛ ግንኙነት እና አባልነት"}>
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
                    <Field label={t.basicInfo.joinDate} htmlFor="joinDate">
                      <Input id="joinDate" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} className="h-9" />
                    </Field>
                    <Field label={t.basicInfo.membershipStatus} htmlFor="membershipStatus">
                      <Select value={formData.membershipStatus} onValueChange={(v) => handleSelectChange("membershipStatus", v)}>
                        <SelectTrigger id="membershipStatus" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">{en ? "Active" : "ንቁ"}</SelectItem>
                          <SelectItem value="Inactive">{en ? "Inactive" : "ንቁ ያልሆነ"}</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </Section>
                </>
              )}

              {/* ============ STEP 2: SPIRITUAL & TRANSFER ============ */}
              {currentStep === 2 && (
                <>
                  <Section title={en ? "Spiritual Journey" : "መንፈሳዊ ጉዞ"}>
                    <Field label={t.spiritualJourney.salvationYearEthiopian} htmlFor="salvationYearEthiopian">
                      <EthiopianYearInput
                        id="salvationYearEthiopian"
                        name="salvationYearEthiopian"
                        value={formData.salvationYearEthiopian}
                        onChange={handleChange}
                        placeholder={en ? "e.g. 2005" : "ለምሳሌ 2005"}
                        className="h-9"
                      />
                    </Field>
                    <Field label={t.spiritualJourney.baptismYearEthiopian} htmlFor="baptismYearEthiopian">
                      <EthiopianYearInput
                        id="baptismYearEthiopian"
                        name="baptismYearEthiopian"
                        value={formData.baptismYearEthiopian}
                        onChange={handleChange}
                        placeholder={en ? "e.g. 2006" : "ለምሳሌ 2006"}
                        className="h-9"
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
                  </Section>

                  <Section title={t.transferInfo.isTransfer} columns={1}>
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
                        <Field label={t.transferInfo.transferDate} htmlFor="transferDate">
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
                  </Section>
                </>
              )}

              {/* ============ STEP 3: SERVICE & FAMILY ============ */}
              {currentStep === 3 && (
                <>
                  <Section title={`${t.serviceMinistry.currentServices} (max 2)`} columns={1}>
                    <div className="flex flex-wrap gap-2">
                      {serviceOptions.map((service) => {
                        const checked = (formData.currentServices || []).includes(service.value)
                        return (
                          <label
                            key={service.value}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              checked ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => toggleService(service.value, c === true)}
                              className="h-3.5 w-3.5"
                            />
                            {service.label}
                          </label>
                        )
                      })}
                    </div>
                  </Section>

                  <Section title={en ? "Family" : "ቤተሰብ"} columns={1}>
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

                        <div className="max-h-56 space-y-1.5 overflow-y-auto">
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
                                  {family.members.map((m, i) => {
                                    const name = typeof m.memberId === "object" ? m.memberId.fullName : String(m.memberId)
                                    return (
                                      <Badge key={i} variant="outline" className="text-xs font-normal">
                                        {name} · {t.family.roles[m.role]}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              </button>
                            )
                          })}
                        </div>
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
                      </div>
                    )}

                    <Field label={t.family.additionalNotes} htmlFor="notes">
                      <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} />
                    </Field>
                  </Section>
                </>
              )}

              {/* ============ STEP 4: EDUCATION & FINANCIAL ============ */}
              {currentStep === 4 && (
                <>
                  <Section title={en ? "Education & Profession" : "ትምህርት እና ሙያ"}>
                    <Field label={t.education.educationLevel} htmlFor="educationLevel">
                      <Select
                        value={formData.educationLevel || ""}
                        onValueChange={(v) => handleSelectChange("educationLevel", v)}
                      >
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
                  </Section>

                  <Section title={t.financial.paysTithe} columns={1}>
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
                          <Select
                            value={formData.titheFrequency}
                            onValueChange={(v) => handleSelectChange("titheFrequency", v)}
                          >
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
                  </Section>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.common.previous}
                </Button>

                <span className="text-xs text-muted-foreground">
                  {currentStep}/{totalSteps}
                </span>

                {currentStep < totalSteps ? (
                  <Button type="button" size="sm" onClick={nextStep} className="gap-1.5">
                    {t.common.next}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
                    {loading ? t.common.saving : en ? "Create Member" : "አባል ይፍጠሩ"}
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  )
}
