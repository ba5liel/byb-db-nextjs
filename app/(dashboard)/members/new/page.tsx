"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
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
import Link from "next/link"
import { useMembers } from "@/lib/members-context"
import { useToast } from "@/hooks/use-toast"

export default function NewMemberPage() {
  const router = useRouter()
  const { addMember } = useMembers()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 8

  const [formData, setFormData] = useState({
    // Basic Information
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male" as const,
    maritalStatus: "Single" as const,
    nationality: "Ethiopian",
    occupation: "",
    photoUrl: "",

    // Address
    address: "",
    city: "Addis Ababa",
    state: "",
    zipCode: "",
    subCity: "",
    woreda: "",
    kebele: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",

    // Spiritual Journey
    salvationDate: "",
    baptismDate: "",
    confirmationDate: "",
    salvationYearEthiopian: "",
    baptismYearEthiopian: "",
    catechesisStatus: "Not Started" as const,
    discipleshipLevel: "",
    discipleshipProgram: "",
    mentor: "",
    testimony: "",
    faithJourneyNotes: "",

    // Church Grouping
    subCommunity: "",
    cellGroupType: "",
    cellGroupNumber: "",
    cellGroupName: "",

    // Transfer Information
    isTransfer: false,
    transferFromChurch: "",
    transferDate: "",
    transferLetterUrl: "",

    // Service & Ministry
    currentServices: [] as string[],
    desiredServices: [] as string[],
    mentorshipBy: "",

    // Family Information
    spouseName: "",
    numberOfChildren: 0,

    // Education & Profession
    educationLevel: "",
    jobType: "",
    profession: "",

    // Financial Contribution
    paysTithe: false,
    titheAmount: 0,
    titheFrequency: "Monthly" as const,

    // Membership
    joinDate: new Date().toISOString().split("T")[0],
    membershipStatus: "Active" as const,
    membershipType: "Regular" as const,
    membershipNumber: `MEM-${Date.now()}`,
    notes: "",
  })

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
      const currentArray = prev[name as keyof typeof prev] as string[]
      if (checked) {
        if (name === "currentServices" && currentArray.length >= 2) {
          toast({
            title: "Maximum services reached",
            description: "Members can only participate in a maximum of 2 services",
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
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          toast({
            title: "Required fields missing",
            description: "Please fill in all required fields (First Name, Last Name, Email, Phone)",
            variant: "destructive",
          })
          return false
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address",
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setLoading(true)

    try {
      addMember(formData)

      toast({
        title: "Member created successfully",
        description: `${formData.firstName} ${formData.lastName} has been added to the system`,
      })

      router.push("/members")
    } catch (error) {
      console.error("Error creating member:", error)
      toast({
        title: "Error creating member",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / totalSteps) * 100

  const steps = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Spiritual Journey", icon: Heart },
    { number: 3, title: "Church Grouping", icon: Users },
    { number: 4, title: "Transfer Info", icon: ArrowLeftRight },
    { number: 5, title: "Service & Ministry", icon: Briefcase },
    { number: 6, title: "Family", icon: Home },
    { number: 7, title: "Education", icon: GraduationCap },
    { number: 8, title: "Financial", icon: DollarSign },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/members">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Members
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Add New Member</h1>
          <p className="text-muted-foreground">Create a comprehensive church member profile</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
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
                {currentStep === 1 && "Enter the member's basic personal information"}
                {currentStep === 2 && "Record the member's spiritual journey and milestones"}
                {currentStep === 3 && "Assign the member to church groups and communities"}
                {currentStep === 4 && "Provide transfer information if applicable"}
                {currentStep === 5 && "Select services and ministry participation"}
                {currentStep === 6 && "Add family and personal status information"}
                {currentStep === 7 && "Enter education and professional details"}
                {currentStep === 8 && "Record financial contribution information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter middle name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="mt-1"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">
                          Phone <span className="text-destructive">*</span>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male (ወንድ)</SelectItem>
                            <SelectItem value="Female">Female (ሴት)</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="maritalStatus">Marital Status</Label>
                        <Select
                          value={formData.maritalStatus}
                          onValueChange={(value) => handleSelectChange("maritalStatus", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single (ያላገባ)</SelectItem>
                            <SelectItem value="Married">Married (ያገባ)</SelectItem>
                            <SelectItem value="Divorced">Divorced (የፈታ)</SelectItem>
                            <SelectItem value="Widowed">Widowed (የሞተበት)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Ethiopian"
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter occupation"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address Information (አድራሻ መረጃ)</h3>
                    <div>
                      <Label htmlFor="address">Street Address (የመንገድ አድራሻ)</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City (ከተማ)</Label>
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
                        <Label htmlFor="subCity">Sub-City (ክፍለ ከተማ)</Label>
                        <Input
                          id="subCity"
                          name="subCity"
                          value={formData.subCity}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter sub-city"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="woreda">Woreda (ወረዳ)</Label>
                        <Input
                          id="woreda"
                          name="woreda"
                          value={formData.woreda}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter woreda"
                        />
                      </div>
                      <div>
                        <Label htmlFor="kebele">Kebele (ቀበሌ)</Label>
                        <Input
                          id="kebele"
                          name="kebele"
                          value={formData.kebele}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter kebele"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter zip code"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Emergency Contact (የአደጋ ጊዜ ግንኙነት)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelation">Relationship</Label>
                        <Input
                          id="emergencyContactRelation"
                          name="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="e.g., Father, Mother, Spouse"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Membership Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="joinDate">
                          Join Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="joinDate"
                          name="joinDate"
                          type="date"
                          value={formData.joinDate}
                          onChange={handleChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="membershipStatus">
                          Membership Status <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.membershipStatus}
                          onValueChange={(value) => handleSelectChange("membershipStatus", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="membershipType">Membership Type</Label>
                        <Select
                          value={formData.membershipType}
                          onValueChange={(value) => handleSelectChange("membershipType", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="Guest">Guest</SelectItem>
                            <SelectItem value="Transferred">Transferred</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Spiritual Journey */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Spiritual Journey (መንፈሳዊ ጉዞ)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="salvationYearEthiopian">
                          ጌታን ያገኙበት አመት (ዓ.ም) - Salvation Year (Ethiopian Calendar)
                        </Label>
                        <Input
                          id="salvationYearEthiopian"
                          name="salvationYearEthiopian"
                          value={formData.salvationYearEthiopian}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="e.g., 2015 ዓ.ም"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salvationDate">Salvation Date (Gregorian Calendar)</Label>
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
                        <Label htmlFor="baptismYearEthiopian">
                          የተጠመቁበት አመት (ዓ.ም) - Baptism Year (Ethiopian Calendar)
                        </Label>
                        <Input
                          id="baptismYearEthiopian"
                          name="baptismYearEthiopian"
                          value={formData.baptismYearEthiopian}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="e.g., 2016 ዓ.ም"
                        />
                      </div>
                      <div>
                        <Label htmlFor="baptismDate">Baptism Date (Gregorian Calendar)</Label>
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
                      <Label htmlFor="confirmationDate">Confirmation Date</Label>
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
                        <Label htmlFor="catechesisStatus">የካቴኬሲስ ሁኔታ - Catechesis Status</Label>
                        <Select
                          value={formData.catechesisStatus}
                          onValueChange={(value) => handleSelectChange("catechesisStatus", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started (አልጀመረም)</SelectItem>
                            <SelectItem value="In Progress">In Progress (በሂደት ላይ)</SelectItem>
                            <SelectItem value="Completed">Completed (ተጠናቋል)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="discipleshipProgram">የደቀመዝሙርነት ፕሮግራም - Discipleship Program</Label>
                        <Input
                          id="discipleshipProgram"
                          name="discipleshipProgram"
                          value={formData.discipleshipProgram}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter program name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discipleshipLevel">Discipleship Level</Label>
                        <Input
                          id="discipleshipLevel"
                          name="discipleshipLevel"
                          value={formData.discipleshipLevel}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="e.g., Level 1, Level 2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mentor">Mentor/Pastor</Label>
                        <Input
                          id="mentor"
                          name="mentor"
                          value={formData.mentor}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter mentor name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="testimony">Testimony</Label>
                      <Textarea
                        id="testimony"
                        name="testimony"
                        value={formData.testimony}
                        onChange={handleChange}
                        className="mt-1"
                        rows={4}
                        placeholder="Share your testimony..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="faithJourneyNotes">Faith Journey Notes</Label>
                      <Textarea
                        id="faithJourneyNotes"
                        name="faithJourneyNotes"
                        value={formData.faithJourneyNotes}
                        onChange={handleChange}
                        className="mt-1"
                        rows={4}
                        placeholder="Additional notes about spiritual journey..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Church Grouping */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Church Community Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subCommunity">Sub-Community (ክፍል)</Label>
                      <Select
                        value={formData.subCommunity}
                        onValueChange={(value) => handleSelectChange("subCommunity", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select sub-community" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alpha">Alpha</SelectItem>
                          <SelectItem value="Beta">Beta</SelectItem>
                          <SelectItem value="Gamma">Gamma</SelectItem>
                          <SelectItem value="Delta">Delta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cellGroupType">Cell Group Type (የቡድን አይነት)</Label>
                      <Select
                        value={formData.cellGroupType}
                        onValueChange={(value) => handleSelectChange("cellGroupType", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select group type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cell Group">Cell Group</SelectItem>
                          <SelectItem value="Home Fellowship">Home Fellowship</SelectItem>
                          <SelectItem value="Youth Group">Youth Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cellGroupNumber">Cell Group Number</Label>
                      <Input
                        id="cellGroupNumber"
                        name="cellGroupNumber"
                        value={formData.cellGroupNumber}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="e.g., CG-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cellGroupName">Cell Group Name</Label>
                      <Input
                        id="cellGroupName"
                        name="cellGroupName"
                        value={formData.cellGroupName}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="Enter group name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Transfer Information */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Transfer Information (የዝውውር መረጃ)</h3>
                  <div>
                    <Label>Is this member transferring from another church?</Label>
                    <RadioGroup
                      value={formData.isTransfer ? "yes" : "no"}
                      onValueChange={(value) => handleCheckboxChange("isTransfer", value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="transfer-yes" />
                        <Label htmlFor="transfer-yes">Yes (አዎ)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="transfer-no" />
                        <Label htmlFor="transfer-no">No (አይደለም)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.isTransfer && (
                    <>
                      <div>
                        <Label htmlFor="transferFromChurch">Transfer From Church</Label>
                        <Input
                          id="transferFromChurch"
                          name="transferFromChurch"
                          value={formData.transferFromChurch}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter previous church name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="transferDate">Transfer Date</Label>
                        <Input
                          id="transferDate"
                          name="transferDate"
                          type="date"
                          value={formData.transferDate}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="transferLetter">Transfer Letter (Upload)</Label>
                        <Input id="transferLetter" type="file" accept=".pdf,.doc,.docx" className="mt-1" />
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload transfer letter (PDF or Word document)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 5: Service & Ministry */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service & Ministry Participation (የአገልግሎት ተሳትፎ)</h3>
                  <p className="text-sm text-muted-foreground">Members can participate in a maximum of 2 services</p>

                  <div>
                    <Label>Current Services (Max 2)</Label>
                    <div className="mt-2 space-y-2">
                      {["Choir", "Youth Ministry", "Sunday School", "Media Team", "Ushering", "Prayer Team"].map(
                        (service) => (
                          <div key={service} className="flex items-center space-x-2">
                            <Checkbox
                              id={`current-${service}`}
                              checked={formData.currentServices.includes(service)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("currentServices", service, checked as boolean)
                              }
                              disabled={
                                !formData.currentServices.includes(service) && formData.currentServices.length >= 2
                              }
                            />
                            <Label htmlFor={`current-${service}`} className="font-normal">
                              {service}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                    {formData.currentServices.length >= 2 && (
                      <p className="text-sm text-amber-600 mt-2">
                        Maximum of 2 services reached. Uncheck a service to select another.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Desired Services</Label>
                    <div className="mt-2 space-y-2">
                      {["Choir", "Youth Ministry", "Sunday School", "Media Team", "Ushering", "Prayer Team"].map(
                        (service) => (
                          <div key={service} className="flex items-center space-x-2">
                            <Checkbox
                              id={`desired-${service}`}
                              checked={formData.desiredServices.includes(service)}
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange("desiredServices", service, checked as boolean)
                              }
                            />
                            <Label htmlFor={`desired-${service}`} className="font-normal">
                              {service}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mentorshipBy">Mentorship By</Label>
                    <Input
                      id="mentorshipBy"
                      name="mentorshipBy"
                      value={formData.mentorshipBy}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="Name of mentor or leader"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Family Information */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Family & Personal Status (የቤተሰብ ሁኔታ)</h3>

                  {formData.maritalStatus === "Married" && (
                    <div>
                      <Label htmlFor="spouseName">Spouse Name (የትዳር ጓደኛ ስም)</Label>
                      <Input
                        id="spouseName"
                        name="spouseName"
                        value={formData.spouseName}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="Enter spouse name"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="numberOfChildren">Number of Children (የልጆች ብዛት)</Label>
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
                    <Label htmlFor="notes">Additional Family Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="mt-1"
                      rows={4}
                      placeholder="Any additional information about family relationships, children, etc."
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Education & Profession */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Education & Professional Information (የትምህርት እና የስራ መረጃ)</h3>
                  <div>
                    <Label htmlFor="educationLevel">Education Level (የትምህርት ደረጃ)</Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(value) => handleSelectChange("educationLevel", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elementary">Elementary</SelectItem>
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Degree">Degree</SelectItem>
                        <SelectItem value="Masters">Masters</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="jobType">Job Type (የስራ አይነት)</Label>
                    <Select value={formData.jobType} onValueChange={(value) => handleSelectChange("jobType", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Government">Government (መንግስት)</SelectItem>
                        <SelectItem value="Private">Private (ግል)</SelectItem>
                        <SelectItem value="Self-Employed">Self-Employed (የራስ ስራ)</SelectItem>
                        <SelectItem value="Student">Student (ተማሪ)</SelectItem>
                        <SelectItem value="Unemployed">Unemployed (ስራ አጥ)</SelectItem>
                        <SelectItem value="Retired">Retired (ጡረተኛ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="profession">Profession/Field</Label>
                    <Input
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="mt-1"
                      placeholder="e.g., Software Engineer, Teacher, Doctor"
                    />
                  </div>
                </div>
              )}

              {/* Step 8: Financial Contribution */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Financial Contribution (የገንዘብ አስተዋፅኦ)</h3>

                  <div>
                    <Label>Pays Tithe? (አስራት ይከፍላሉ?)</Label>
                    <RadioGroup
                      value={formData.paysTithe ? "yes" : "no"}
                      onValueChange={(value) => handleCheckboxChange("paysTithe", value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="tithe-yes" />
                        <Label htmlFor="tithe-yes">Yes (አዎ)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="tithe-no" />
                        <Label htmlFor="tithe-no">No (አይደለም)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.paysTithe && (
                    <>
                      <div>
                        <Label htmlFor="titheAmount">Tithe Amount (in Birr)</Label>
                        <Input
                          id="titheAmount"
                          name="titheAmount"
                          type="number"
                          min="0"
                          value={formData.titheAmount}
                          onChange={handleChange}
                          className="mt-1"
                          placeholder="Enter amount in Birr"
                        />
                      </div>

                      <div>
                        <Label htmlFor="titheFrequency">Payment Frequency (የክፍያ ድግግሞሽ)</Label>
                        <Select
                          value={formData.titheFrequency}
                          onValueChange={(value) => handleSelectChange("titheFrequency", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Weekly">Weekly (ሳምንታዊ)</SelectItem>
                            <SelectItem value="Monthly">Monthly (ወርሃዊ)</SelectItem>
                            <SelectItem value="Yearly">Yearly (ዓመታዊ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6 mt-6 border-t">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="gap-2 bg-transparent">
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="gap-2 ml-auto">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="gap-2 ml-auto">
                    {loading ? "Creating Member..." : "Create Member"}
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
