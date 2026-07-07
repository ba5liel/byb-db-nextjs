"use client"

/**
 * Create Church Service Page
 * 
 * Form to create a new church service/ministry.
 * Only accessible to superAdmin users.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useChurchServices } from "@/lib/church-services-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { CreateChurchServiceDto, ServiceType } from "@/lib/types"

const SERVICE_TYPE_VALUES: ServiceType[] = [
  "worship", "evangelism", "social_service", "education", "youth",
  "children", "prayer", "media", "administration", "other",
]

export default function NewChurchServicePage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const { createService, loading, error } = useChurchServices()

  // Form state
  const [formData, setFormData] = useState<CreateChurchServiceDto>({
    serviceName: "",
    serviceDescription: "",
    type: "worship",
    leader: "",
    secretary: "",
    leadership_start: new Date().toISOString().split("T")[0],
    leadership_end: "",
    maximum_members_allowed: undefined,
    meeting_schedule: "",
    meeting_location: "",
    status: true,
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  // Handle input changes
  const handleChange = (
    field: keyof CreateChurchServiceDto,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSubmitError(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    try {
      // Validate required fields
      if (!formData.serviceName.trim()) {
        setSubmitError(tr.churchServices.serviceNameRequired)
        return
      }
      if (!formData.serviceDescription.trim()) {
        setSubmitError(tr.churchServices.serviceDescRequired)
        return
      }
      if (!formData.leader.trim()) {
        setSubmitError(tr.churchServices.leaderRequired)
        return
      }

      const serviceData = {
        ...formData,
        ...(formData.maximum_members_allowed && {
          maximum_members_allowed: Number(formData.maximum_members_allowed),
        }),
      }

      const newService = await createService(serviceData)
      router.push(`/church-services/${newService._id}`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : tr.churchServices.createFailed
      )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/church-services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{tr.churchServices.createService}</h1>
          <p className="text-muted-foreground mt-1">{tr.churchServices.createServiceSubtitle}</p>
        </div>
      </div>

      {/* Error Messages */}
      {(error || submitError) && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{submitError || error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{tr.churchServices.serviceInformation}</CardTitle>
            <CardDescription>{tr.churchServices.basicInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">
                {tr.churchServices.serviceName} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => handleChange("serviceName", e.target.value)}
                placeholder={tr.churchServices.serviceNamePlaceholder}
                required
                maxLength={150}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">
                {tr.churchServices.description} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) =>
                  handleChange("serviceDescription", e.target.value)
                }
                placeholder={tr.churchServices.descriptionPlaceholder}
                required
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                {tr.churchServices.serviceType} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPE_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {tr.churchServices.typeLabels[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leader */}
            <div className="space-y-2">
              <Label htmlFor="leader">
                {tr.churchServices.leader} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="leader"
                value={formData.leader}
                onChange={(e) => handleChange("leader", e.target.value)}
                placeholder={tr.common.required}
                required
              />
              <p className="text-sm text-muted-foreground">{tr.churchServices.leaderHelp}</p>
            </div>

            {/* Secretary */}
            <div className="space-y-2">
              <Label htmlFor="secretary">{tr.churchServices.secretary}</Label>
              <Input
                id="secretary"
                value={formData.secretary || ""}
                onChange={(e) => handleChange("secretary", e.target.value)}
                placeholder={tr.common.optional}
              />
            </div>

            {/* Leadership Start Date */}
            <div className="space-y-2">
              <Label htmlFor="leadership_start">
                {tr.churchServices.leadershipStart} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="leadership_start"
                type="date"
                value={formData.leadership_start}
                onChange={(e) =>
                  handleChange("leadership_start", e.target.value)
                }
                required
              />
            </div>

            {/* Leadership End Date */}
            <div className="space-y-2">
              <Label htmlFor="leadership_end">{tr.churchServices.leadershipEnd}</Label>
              <Input
                id="leadership_end"
                type="date"
                value={formData.leadership_end || ""}
                onChange={(e) =>
                  handleChange("leadership_end", e.target.value || undefined)
                }
              />
            </div>

            {/* Maximum Members */}
            <div className="space-y-2">
              <Label htmlFor="maximum_members_allowed">{tr.churchServices.maxMembers}</Label>
              <Input
                id="maximum_members_allowed"
                type="number"
                min="1"
                value={formData.maximum_members_allowed || ""}
                onChange={(e) =>
                  handleChange(
                    "maximum_members_allowed",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder={tr.churchServices.maxMembersPlaceholder}
              />
            </div>

            {/* Meeting Schedule */}
            <div className="space-y-2">
              <Label htmlFor="meeting_schedule">{tr.churchServices.meetingSchedule}</Label>
              <Input
                id="meeting_schedule"
                value={formData.meeting_schedule || ""}
                onChange={(e) =>
                  handleChange("meeting_schedule", e.target.value || undefined)
                }
                placeholder={tr.churchServices.meetingSchedulePlaceholder}
              />
            </div>

            {/* Meeting Location */}
            <div className="space-y-2">
              <Label htmlFor="meeting_location">{tr.churchServices.meetingLocation}</Label>
              <Input
                id="meeting_location"
                value={formData.meeting_location || ""}
                onChange={(e) =>
                  handleChange("meeting_location", e.target.value || undefined)
                }
                placeholder={tr.churchServices.meetingLocationPlaceholder}
              />
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => handleChange("status", checked)}
              />
              <Label htmlFor="status">{tr.churchServices.activeService}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 mt-6">
          <Link href="/church-services" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {tr.common.cancel}
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {loading ? tr.churchServices.creating : tr.churchServices.createServiceBtn}
          </Button>
        </div>
      </form>
    </div>
  )
}

