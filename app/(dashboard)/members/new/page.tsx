"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Heart,
  Users,
  ArrowLeftRight,
  Briefcase,
  Home,
  GraduationCap,
  DollarSign,
  Check,
} from "lucide-react"
import { useMembers } from "@/lib/members-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { Member } from "@/lib/types"

export default function NewMemberPage() {
  const router = useRouter()
  const { addMember } = useMembers()
  const { toast } = useToast()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 8

  const [formData, setFormData] = useState<Partial<Member>>({
    // Basic Information
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    yearOfBirthEthiopian: "",
    dateOfBirth: "",
    gender: "Male",
    photoUrl: "",
    membershipNumber: `MEM-${Date.now()}`,
    registrationDate: new Date().toISOString().split("T")[0],

    // Address
    physicalAddress: "",
    address: "",
    city: "Addis Ababa",
    subCity: "",
    woreda: "",
    kebele: "",
    zipCode: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",

    // Spiritual Journey
    salvationYearEthiopian: "",
    salvationDate: "",
    baptismYearEthiopian: "",
    baptismDate: "",
    confirmationDate: "",
    catechesisStatus: "Not Started",
    discipleshipProgram: "",
    discipleshipLevel: "",
    mentor: "",
    testimony: "",
    faithJourneyNotes: "",

    // Church Grouping
    subCommunity: undefined,
    currentGroupType: undefined,
    cellGroupName: "",
    cellGroupNumber: "",
    reasonForNoGroup: "",

    // Transfer Information
    isTransfer: false,
    transferFromChurch: "",
    transferYearEthiopian: "",
    transferDate: "",
    transferLetterUrl: "",

    // Service & Ministry
    currentServices: [],
    desiredServices: [],
    mentorshipBy: "",

    // Family & Personal Status
    maritalStatus: "Unmarried",
    spouseName: "",
    spouseMemberId: "",
    numberOfChildren: 0,

    // Education & Profession
    educationLevel: undefined,
    jobType: undefined,
    profession: "",
    occupation: "",

    // Financial Contribution
    paysTithe: false,
    titheAmount: 0,
    titheFrequency: "Monthly",

    // Membership
    joinDate: new Date().toISOString().split("T")[0],
    membershipStatus: "Active",
    membershipType: "Regular",
    nationality: "Ethiopian",
    notes: "",
  })

  // Auto-calculate age group when date of birth changes
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

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleMultiSelectChange = (name: string, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentArray = (prev[name as keyof typeof prev] as string[]) || []
      if (checked) {
        if (name === "currentServices" && currentArray.length >= 2) {
          toast({
            title: locale === "en" ? "Maximum services reached" : "ከፍተኛው አገልግሎቶች ደርሰዋል",
            description: t.serviceMinistry.maxServicesReached,
            variant: "destructive",
          })
          return prev
        }
        return { ...prev, [name]: [...currentArray, value] }
      } else {
        return { ...prev, [name]: currentArray.filter((item) => item !== value) }
      }
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          toast({
            title: locale === "en" ? "Required fields missing" : "አስፈላጊ መስኮች ይጎድላሉ",
            description: t.memberForm.requiredFields,
            variant: "destructive",
          })
          return false
        }
        // Phone validation
        if (formData.phone && formData.phone.length < 9) {
          toast({
            title: locale === "en" ? "Invalid phone number" : "ልክ ያልሆነ ስልክ ቁጥር",
            description: locale === "en" ? "Please enter a valid phone number" : "እባክዎ ልክ ያለ ስልክ ቁጥር ያስገቡ",
            variant: "destructive",
          })
          return false
        }
        // Email validation if provided
        if (formData.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(formData.email)) {
            toast({
              title: locale === "en" ? "Invalid email" : "ልክ ያልሆነ ኢሜይል",
              description: locale === "en" ? "Please enter a valid email address" : "እባክዎ ልክ ያለ ኢሜይል አድራሻ ያስገቡ",
              variant: "destructive",
            })
            return false
          }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setLoading(true)

    try {
      const memberData = {
        ...formData,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        phone: formData.phone!,
        gender: formData.gender!,
        maritalStatus: formData.maritalStatus!,
        isTransfer: formData.isTransfer!,
        currentServices: formData.currentServices || [],
        desiredServices: formData.desiredServices || [],
        numberOfChildren: formData.numberOfChildren || 0,
        paysTithe: formData.paysTithe!,
        joinDate: formData.joinDate!,
        membershipStatus: formData.membershipStatus!,
        membershipType: formData.membershipType!,
      } as Omit<Member, "id" | "createdAt" | "updatedAt">

      await addMember(memberData)

      toast({
        title: t.memberForm.createSuccess,
        description: `${formData.firstName} ${formData.lastName} ${locale === "en" ? "has been added to the system" : "ወደ ስርዓቱ ታክሏል"}`,
      })

      router.push("/members")
    } catch (error) {
      console.error("Error creating member:", error)
      toast({
        title: t.memberForm.createError,
        description: locale === "en" ? "Please try again" : "እባክዎ እንደገና ይሞክሩ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / totalSteps) * 100

  const steps = [
    { number: 1, title: t.memberSteps.basicInfo, icon: User },
    { number: 2, title: t.memberSteps.spiritualJourney, icon: Heart },
    { number: 3, title: t.memberSteps.churchGrouping, icon: Users },
    { number: 4, title: t.memberSteps.transferInfo, icon: ArrowLeftRight },
    { number: 5, title: t.memberSteps.serviceMinistry, icon: Briefcase },
    { number: 6, title: t.memberSteps.family, icon: Home },
    { number: 7, title: t.memberSteps.education, icon: GraduationCap },
    { number: 8, title: t.memberSteps.financial, icon: DollarSign },
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/members">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t.common.back}
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t.memberForm.createTitle}</h1>
          <p className="text-muted-foreground">{t.memberForm.createSubtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {t.memberForm.stepProgress.replace("{current}", String(currentStep)).replace("{total}", String(totalSteps))}
            </span>
            <span className="text-sm text-muted-foreground">
              {t.memberForm.percentComplete.replace("{percent}", String(Math.round(progress)))}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {steps.map((step) => {
              const StepIcon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div
                  key={step.number}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  <span className="text-sm font-medium whitespace-nowrap">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && t.basicInfo.subtitle}
                {currentStep === 2 && t.spiritualJourney.subtitle}
                {currentStep === 3 && t.churchGrouping.subtitle}
                {currentStep === 4 && t.transferInfo.subtitle}
                {currentStep === 5 && t.serviceMinistry.subtitle}
                {currentStep === 6 && t.family.subtitle}
                {currentStep === 7 && t.education.subtitle}
                {currentStep === 8 && t.financial.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.basicInfo.personalInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName">
                          {t.basicInfo.firstName} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter first name" : "የመጀመሪያ ስም ያስገቡ"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="middleName">{t.basicInfo.middleName}</Label>
                        <Input
                          id="middleName"
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter middle name" : "የአባት ስም ያስገቡ"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">
                          {t.basicInfo.lastName} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter last name" : "የአያት ስም ያስገቡ"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">
                          {t.basicInfo.phoneNumber} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder="+251 9XX XXX XXX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">
                          {t.basicInfo.email} <span className="text-muted-foreground text-xs">({t.common.optional})</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="yearOfBirthEthiopian">{t.basicInfo.yearOfBirthEthiopian}</Label>
                        <Input
                          id="yearOfBirthEthiopian"
                          name="yearOfBirthEthiopian"
                          value={formData.yearOfBirthEthiopian}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "e.g., 2015 ዓ.ም" : "ምሳሌ፡ 2015 ዓ.ም"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth">{t.basicInfo.dateOfBirth}</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">{t.basicInfo.gender}</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">{t.common.male}</SelectItem>
                            <SelectItem value="Female">{t.common.female}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.ageGroup && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">
                          {locale === "en" ? "Age Group (Auto-calculated)" : "የዕድሜ ክፍል (በራስ ተሰልቷል)"}:{" "}
                          <span className="text-primary">
                            {formData.ageGroup === "Children" && t.ageGroup.children}
                            {formData.ageGroup === "Teenagers" && t.ageGroup.teenagers}
                            {formData.ageGroup === "Youth" && t.ageGroup.youth}
                            {formData.ageGroup === "Adults" && t.ageGroup.adults}
                            {formData.ageGroup === "Seniors" && t.ageGroup.seniors}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maritalStatus">{t.basicInfo.maritalStatus}</Label>
                        <Select
                          value={formData.maritalStatus}
                          onValueChange={(value) => handleSelectChange("maritalStatus", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unmarried">{t.maritalStatus.unmarried}</SelectItem>
                            <SelectItem value="Married">{t.maritalStatus.married}</SelectItem>
                            <SelectItem value="Divorced">{t.maritalStatus.divorced}</SelectItem>
                            <SelectItem value="Widowed">{t.maritalStatus.widowed}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nationality">{t.basicInfo.nationality}</Label>
                        <Input
                          id="nationality"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Ethiopian"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.basicInfo.addressInfo}</h3>
                    <div>
                      <Label htmlFor="physicalAddress">{t.basicInfo.physicalAddress}</Label>
                      <Textarea
                        id="physicalAddress"
                        name="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={handleChange}
                        className="mt-1"
                        rows={2}
                        placeholder={locale === "en" ? "Enter physical address" : "የመኖሪያ አድራሻ ያስገቡ"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">{t.basicInfo.city}</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Addis Ababa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subCity">{t.basicInfo.subCity}</Label>
                        <Input
                          id="subCity"
                          name="subCity"
                          value={formData.subCity}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter sub-city" : "ክፍለ ከተማ ያስገቡ"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="woreda">{t.basicInfo.woreda}</Label>
                        <Input
                          id="woreda"
                          name="woreda"
                          value={formData.woreda}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter woreda" : "ወረዳ ያስገቡ"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="kebele">{t.basicInfo.kebele}</Label>
                        <Input
                          id="kebele"
                          name="kebele"
                          value={formData.kebele}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter kebele" : "ቀበሌ ያስገቡ"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">{t.basicInfo.zipCode}</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter zip code" : "የፖስታ ኮድ ያስገቡ"}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.basicInfo.emergencyContact}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactName">{t.basicInfo.emergencyContactName}</Label>
                        <Input
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Contact name" : "የመገናኛ ስም"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelation">{t.basicInfo.emergencyContactRelation}</Label>
                        <Input
                          id="emergencyContactRelation"
                          name="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "e.g., Father, Mother, Spouse" : "ምሳሌ፡ አባት፣ እናት፣ የትዳር ጓደኛ"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">{t.basicInfo.emergencyContactPhone}</Label>
                        <Input
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="+251 9XX XXX XXX"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t.basicInfo.membershipInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="joinDate">{t.basicInfo.joinDate}</Label>
                        <Input
                          id="joinDate"
                          name="joinDate"
                          type="date"
                          value={formData.joinDate}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="membershipStatus">{t.basicInfo.membershipStatus}</Label>
                        <Select
                          value={formData.membershipStatus}
                          onValueChange={(value) => handleSelectChange("membershipStatus", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">{t.status.active}</SelectItem>
                            <SelectItem value="Inactive">{t.status.inactive}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="membershipType">{t.basicInfo.membershipType}</Label>
                        <Select
                          value={formData.membershipType}
                          onValueChange={(value) => handleSelectChange("membershipType", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular">
                              {locale === "en" ? "Regular" : "መደበኛ"}
                            </SelectItem>
                            <SelectItem value="Guest">
                              {locale === "en" ? "Guest" : "እንግዳ"}
                            </SelectItem>
                            <SelectItem value="Transferred">
                              {locale === "en" ? "Transferred" : "የተዛወረ"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">{t.basicInfo.membershipNumber}:</span>{" "}
                        <span className="font-mono text-primary">{formData.membershipNumber}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === "en" ? "Auto-generated unique ID" : "በራስ የተፈጠረ ልዩ መለያ"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Spiritual Journey */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salvationYearEthiopian">{t.spiritualJourney.salvationYearEthiopian}</Label>
                      <Input
                        id="salvationYearEthiopian"
                        name="salvationYearEthiopian"
                        value={formData.salvationYearEthiopian}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "e.g., 2015 ዓ.ም" : "ምሳሌ፡ 2015 ዓ.ም"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="salvationDate">{t.spiritualJourney.salvationDate}</Label>
                      <Input
                        id="salvationDate"
                        name="salvationDate"
                        type="date"
                        value={formData.salvationDate}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="baptismYearEthiopian">{t.spiritualJourney.baptismYearEthiopian}</Label>
                      <Input
                        id="baptismYearEthiopian"
                        name="baptismYearEthiopian"
                        value={formData.baptismYearEthiopian}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "e.g., 2016 ዓ.ም" : "ምሳሌ፡ 2016 ዓ.ም"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="baptismDate">{t.spiritualJourney.baptismDate}</Label>
                      <Input
                        id="baptismDate"
                        name="baptismDate"
                        type="date"
                        value={formData.baptismDate}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmationDate">{t.spiritualJourney.confirmationDate}</Label>
                    <Input
                      id="confirmationDate"
                      name="confirmationDate"
                      type="date"
                      value={formData.confirmationDate}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="catechesisStatus">{t.spiritualJourney.catechesisStatus}</Label>
                      <Select
                        value={formData.catechesisStatus}
                        onValueChange={(value) => handleSelectChange("catechesisStatus", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">{t.catechesisStatus.notStarted}</SelectItem>
                          <SelectItem value="In Progress">{t.catechesisStatus.inProgress}</SelectItem>
                          <SelectItem value="Completed">{t.catechesisStatus.completed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discipleshipProgram">{t.spiritualJourney.discipleshipProgram}</Label>
                      <Input
                        id="discipleshipProgram"
                        name="discipleshipProgram"
                        value={formData.discipleshipProgram}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "Enter program name" : "የፕሮግራም ስም ያስገቡ"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discipleshipLevel">{t.spiritualJourney.discipleshipLevel}</Label>
                      <Input
                        id="discipleshipLevel"
                        name="discipleshipLevel"
                        value={formData.discipleshipLevel}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "e.g., Level 1, Level 2" : "ምሳሌ፡ ደረጃ 1፣ ደረጃ 2"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mentor">{t.spiritualJourney.mentor}</Label>
                      <Input
                        id="mentor"
                        name="mentor"
                        value={formData.mentor}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "Enter mentor name" : "የእረኛ ስም ያስገቡ"}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="testimony">{t.spiritualJourney.testimony}</Label>
                    <Textarea
                      id="testimony"
                      name="testimony"
                      value={formData.testimony}
                      onChange={handleChange}
                      className="mt-1"
                      rows={4}
                      placeholder={locale === "en" ? "Share your testimony..." : "ምስክርነትዎን ያካፍሉ..."}
                    />
                  </div>

                  <div>
                    <Label htmlFor="faithJourneyNotes">{t.spiritualJourney.faithJourneyNotes}</Label>
                    <Textarea
                      id="faithJourneyNotes"
                      name="faithJourneyNotes"
                      value={formData.faithJourneyNotes}
                      onChange={handleChange}
                      className="mt-1"
                      rows={4}
                      placeholder={locale === "en" ? "Additional notes about spiritual journey..." : "ተጨማሪ የመንፈሳዊ ጉዞ ማስታወሻዎች..."}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Church Grouping */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subCommunity">{t.churchGrouping.subCommunity}</Label>
                      <Select
                        value={formData.subCommunity}
                        onValueChange={(value) => handleSelectChange("subCommunity", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={locale === "en" ? "Select sub-community" : "መንደር/ክፍል ይምረጡ"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Jemmo">{t.subCommunity.jemmo}</SelectItem>
                          <SelectItem value="Bethel">{t.subCommunity.bethel}</SelectItem>
                          <SelectItem value="Weyira">{t.subCommunity.weyira}</SelectItem>
                          <SelectItem value="Alfa">{t.subCommunity.alfa}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currentGroupType">{t.churchGrouping.currentGroupType}</Label>
                      <Select
                        value={formData.currentGroupType}
                        onValueChange={(value) => handleSelectChange("currentGroupType", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={locale === "en" ? "Select group type" : "የቡድን አይነት ይምረጡ"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cell Group">{t.groupType.cellGroup}</SelectItem>
                          <SelectItem value="Youth Group">{t.groupType.youthGroup}</SelectItem>
                          <SelectItem value="Bible Study">{t.groupType.bibleStudy}</SelectItem>
                          <SelectItem value="Prayer Group">{t.groupType.prayerGroup}</SelectItem>
                          <SelectItem value="None">{t.groupType.none}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.currentGroupType && formData.currentGroupType !== "None" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cellGroupNumber">{t.churchGrouping.cellGroupNumber}</Label>
                        <Input
                          id="cellGroupNumber"
                          name="cellGroupNumber"
                          value={formData.cellGroupNumber}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "e.g., CG-001" : "ምሳሌ፡ CG-001"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cellGroupName">{t.churchGrouping.cellGroupName}</Label>
                        <Input
                          id="cellGroupName"
                          name="cellGroupName"
                          value={formData.cellGroupName}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter group name" : "የቡድን ስም ያስገቡ"}
                        />
                      </div>
                    </div>
                  )}

                  {formData.currentGroupType === "None" && (
                    <div>
                      <Label htmlFor="reasonForNoGroup">{t.churchGrouping.reasonForNoGroup}</Label>
                      <Textarea
                        id="reasonForNoGroup"
                        name="reasonForNoGroup"
                        value={formData.reasonForNoGroup}
                        onChange={handleChange}
                        className="mt-1"
                        rows={3}
                        placeholder={locale === "en" ? "Please explain why member is not in a group" : "አባሉ በቡድን ውስጥ ያልሆነበትን ምክንያት ያብራሩ"}
                      />
                    </div>
                  )}

                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-foreground">
                      <strong>{locale === "en" ? "Note:" : "ማስታወሻ:"}</strong>{" "}
                      {locale === "en"
                        ? "For adults (አዋቂዎች), cell groups are organized by sub-community and assigned home cell numbers. For youth (ወጣቶች), cell groups are not sub-community-based and are more randomly distributed across the church."
                        : "ለአዋቂዎች (አዋቂዎች) ሴል ግሩፖች በመንደር/ክፍል የተደራጁ እና የቤት ሴል ቁጥሮች የተመደቡ ናቸው። ለወጣቶች (ወጣቶች) ሴል ግሩፖች በመንደር/ክፍል ላይ የተመሰረቱ ሳይሆኑ በቤተክርስትያን ውስጥ በዘፈቀደ ይሰራጫሉ።"}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Transfer Information */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label>{t.transferInfo.isTransfer}</Label>
                    <RadioGroup
                      value={formData.isTransfer ? "yes" : "no"}
                      onValueChange={(value) => handleCheckboxChange("isTransfer", value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="transfer-yes" />
                        <Label htmlFor="transfer-yes">{t.common.yes}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="transfer-no" />
                        <Label htmlFor="transfer-no">{t.common.no}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.isTransfer && (
                    <>
                      <div>
                        <Label htmlFor="transferFromChurch">{t.transferInfo.transferFromChurch}</Label>
                        <Input
                          id="transferFromChurch"
                          name="transferFromChurch"
                          value={formData.transferFromChurch}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter previous church name" : "ቀደም ያለውን የቤተክርስትያን ስም ያስገቡ"}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="transferYearEthiopian">{t.transferInfo.transferYearEthiopian}</Label>
                          <Input
                            id="transferYearEthiopian"
                            name="transferYearEthiopian"
                            value={formData.transferYearEthiopian}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder={locale === "en" ? "e.g., 2017 ዓ.ም" : "ምሳሌ፡ 2017 ዓ.ም"}
                          />
                        </div>
                        <div>
                          <Label htmlFor="transferDate">{t.transferInfo.transferDate}</Label>
                          <Input
                            id="transferDate"
                            name="transferDate"
                            type="date"
                            value={formData.transferDate}
                            onChange={handleChange}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="transferLetter">{t.transferInfo.transferLetter}</Label>
                        <Input id="transferLetter" type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="mt-1" />
                        <p className="text-sm text-muted-foreground mt-1">
                          {locale === "en"
                            ? "Upload transfer letter (PDF, Word, or Image)"
                            : "የዝውውር ደብዳቤ ይስቀሉ (PDF፣ Word ወይም ምስል)"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 5: Service & Ministry */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">{t.serviceMinistry.currentServices}</Label>
                    <p className="text-sm text-muted-foreground mb-3">{t.serviceMinistry.currentServicesNote}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {serviceOptions.map((service) => (
                        <div key={service.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-${service.value}`}
                            checked={formData.currentServices?.includes(service.value)}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange("currentServices", service.value, checked as boolean)
                            }
                            disabled={
                              !formData.currentServices?.includes(service.value) &&
                              (formData.currentServices?.length || 0) >= 2
                            }
                          />
                          <Label htmlFor={`current-${service.value}`} className="font-normal cursor-pointer">
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {(formData.currentServices?.length || 0) >= 2 && (
                      <p className="text-sm text-amber-600 mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                        {t.serviceMinistry.maxServicesReached}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold">{t.serviceMinistry.desiredServices}</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      {locale === "en"
                        ? "Select services the member wishes to serve in the future"
                        : "አባሉ ወደፊት ማገልገል የሚፈልጉባቸውን አገልግሎቶች ይምረጡ"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {serviceOptions.map((service) => (
                        <div key={service.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`desired-${service.value}`}
                            checked={formData.desiredServices?.includes(service.value)}
                            onCheckedChange={(checked) =>
                              handleMultiSelectChange("desiredServices", service.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={`desired-${service.value}`} className="font-normal cursor-pointer">
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="mentorshipBy">{t.serviceMinistry.mentorshipBy}</Label>
                    <Input
                      id="mentorshipBy"
                      name="mentorshipBy"
                      value={formData.mentorshipBy}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder={locale === "en" ? "Name of mentor or leader" : "የእረኛ ወይም መሪ ስም"}
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Family Information */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  {formData.maritalStatus === "Married" && (
                    <div>
                      <Label htmlFor="spouseName">{t.family.spouseName}</Label>
                      <Input
                        id="spouseName"
                        name="spouseName"
                        value={formData.spouseName}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder={locale === "en" ? "Enter spouse name" : "የትዳር ጓደኛ ስም ያስገቡ"}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === "en"
                          ? "If spouse is also a member, they can be linked from the member list"
                          : "የትዳር ጓደኛ አባልም ከሆነ ከአባላት ዝርዝር ሊገናኙ ይችላሉ"}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="numberOfChildren">{t.family.numberOfChildren}</Label>
                    <Input
                      id="numberOfChildren"
                      name="numberOfChildren"
                      type="number"
                      min="0"
                      value={formData.numberOfChildren}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">{t.family.additionalNotes}</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="mt-1"
                      rows={4}
                      placeholder={
                        locale === "en"
                          ? "Any additional information about family relationships, children, etc."
                          : "ስለ ቤተሰብ ግንኙነቶች፣ ልጆች፣ ወዘተ ማንኛውም ተጨማሪ መረጃ"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Education & Profession */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="educationLevel">{t.education.educationLevel}</Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(value) => handleSelectChange("educationLevel", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={locale === "en" ? "Select education level" : "የትምህርት ደረጃ ይምረጡ"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uneducated">{t.educationLevel.uneducated}</SelectItem>
                        <SelectItem value="1-8">{t.educationLevel.level1_8}</SelectItem>
                        <SelectItem value="9-12">{t.educationLevel.level9_12}</SelectItem>
                        <SelectItem value="Finished 12">{t.educationLevel.finished12}</SelectItem>
                        <SelectItem value="Diploma">{t.educationLevel.diploma}</SelectItem>
                        <SelectItem value="Degree">{t.educationLevel.degree}</SelectItem>
                        <SelectItem value="Masters">{t.educationLevel.masters}</SelectItem>
                        <SelectItem value="PhD">{t.educationLevel.phd}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="jobType">{t.education.jobType}</Label>
                    <Select value={formData.jobType} onValueChange={(value) => handleSelectChange("jobType", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={locale === "en" ? "Select job type" : "የስራ አይነት ይምረጡ"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">{t.jobType.personal}</SelectItem>
                        <SelectItem value="Government">{t.jobType.government}</SelectItem>
                        <SelectItem value="Private">{t.jobType.private}</SelectItem>
                        <SelectItem value="Unemployed">{t.jobType.unemployed}</SelectItem>
                        <SelectItem value="Student">{t.jobType.student}</SelectItem>
                        <SelectItem value="Retired">{t.jobType.retired}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="profession">{t.education.profession}</Label>
                    <Input
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder={
                        locale === "en"
                          ? "e.g., Software Engineer, Teacher, Doctor"
                          : "ምሳሌ፡ የሶፍትዌር ኢንጂነር፣ መምህር፣ ዶክተር"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 8: Financial Contribution */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <div>
                    <Label>{t.financial.paysTithe}</Label>
                    <RadioGroup
                      value={formData.paysTithe ? "yes" : "no"}
                      onValueChange={(value) => handleCheckboxChange("paysTithe", value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="tithe-yes" />
                        <Label htmlFor="tithe-yes">{t.common.yes}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="tithe-no" />
                        <Label htmlFor="tithe-no">{t.common.no}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.paysTithe && (
                    <>
                      <div>
                        <Label htmlFor="titheAmount">{t.financial.titheAmountInBirr}</Label>
                        <Input
                          id="titheAmount"
                          name="titheAmount"
                          type="number"
                          min="0"
                          value={formData.titheAmount}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder={locale === "en" ? "Enter amount in Birr" : "መጠን በብር ያስገቡ"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="titheFrequency">{t.financial.titheFrequency}</Label>
                        <Select
                          value={formData.titheFrequency}
                          onValueChange={(value) => handleSelectChange("titheFrequency", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Weekly">{t.frequency.weekly}</SelectItem>
                            <SelectItem value="Monthly">{t.frequency.monthly}</SelectItem>
                            <SelectItem value="Occasionally">{t.frequency.occasionally}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 mt-6 border-t">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="gap-2 w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4" />
                    {t.common.previous}
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="gap-2 w-full sm:w-auto sm:ml-auto">
                    {t.common.next}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto sm:ml-auto">
                    {loading
                      ? t.common.saving
                      : locale === "en"
                        ? "Create Member"
                        : "አባል ይፍጠሩ"}
                    <Check className="w-4 h-4" />
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
