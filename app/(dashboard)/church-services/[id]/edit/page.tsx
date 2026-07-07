"use client"

/**
 * Edit Church Service Page
 * 
 * Form to edit an existing church service/ministry.
 * Only accessible to superAdmin users.
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save } from "lucide-react"
import { useChurchServices } from "@/lib/church-services-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { UpdateChurchServiceDto, ServiceType } from "@/lib/types"

const SERVICE_TYPE_VALUES: ServiceType[] = [
  "worship", "evangelism", "social_service", "education", "youth",
  "children", "prayer", "media", "administration", "other",
]

export default function EditChurchServicePage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const { getService, updateService, loading, error } = useChurchServices()
  const [service, setService] = useState<any>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<UpdateChurchServiceDto>({
    serviceName: "",
    serviceDescription: "",
    type: "worship",
    leader: "",
    secretary: "",
    leadership_start: "",
    leadership_end: "",
    maximum_members_allowed: undefined,
    meeting_schedule: "",
    meeting_location: "",
    status: true,
  })

  // Fetch service data
  useEffect(() => {
    if (serviceId) {
      getService(serviceId).then((serviceData) => {
        if (serviceData) {
          setService(serviceData)
          // Populate form with existing data
          setFormData({
            serviceName: serviceData.serviceName || "",
            serviceDescription: serviceData.serviceDescription || "",
            type: serviceData.type || "worship",
            leader:
              typeof serviceData.leader === "object"
                ? serviceData.leader._id
                : serviceData.leader || "",
            secretary:
              serviceData.secretary
                ? typeof serviceData.secretary === "object"
                  ? serviceData.secretary._id
                  : serviceData.secretary
                : "",
            leadership_start: serviceData.leadership_start
              ? new Date(serviceData.leadership_start)
                  .toISOString()
                  .split("T")[0]
              : "",
            leadership_end: serviceData.leadership_end
              ? new Date(serviceData.leadership_end).toISOString().split("T")[0]
              : "",
            maximum_members_allowed: serviceData.maximum_members_allowed,
            meeting_schedule: serviceData.meeting_schedule || "",
            meeting_location: serviceData.meeting_location || "",
            status: serviceData.status ?? true,
          })
        }
      })
    }
  }, [serviceId, getService])

  // Handle input changes
  const handleChange = (
    field: keyof UpdateChurchServiceDto,
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
      // Build update payload (only include changed fields)
      const updateData: UpdateChurchServiceDto = {}

      if (formData.serviceName) updateData.serviceName = formData.serviceName
      if (formData.serviceDescription)
        updateData.serviceDescription = formData.serviceDescription
      if (formData.type) updateData.type = formData.type
      if (formData.leader) updateData.leader = formData.leader
      if (formData.secretary !== undefined)
        updateData.secretary = formData.secretary || undefined
      if (formData.leadership_start)
        updateData.leadership_start = formData.leadership_start
      if (formData.leadership_end)
        updateData.leadership_end = formData.leadership_end
      if (formData.maximum_members_allowed !== undefined)
        updateData.maximum_members_allowed = Number(
          formData.maximum_members_allowed
        )
      if (formData.meeting_schedule !== undefined)
        updateData.meeting_schedule = formData.meeting_schedule || undefined
      if (formData.meeting_location !== undefined)
        updateData.meeting_location = formData.meeting_location || undefined
      if (formData.status !== undefined) updateData.status = formData.status

      const updatedService = await updateService(serviceId, updateData)
      router.push(`/church-services/${updatedService._id}`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : tr.churchServices.updateFailed
      )
    }
  }

  if (loading && !service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Link href="/church-services" className="mt-4 inline-block">
              <Button variant="outline">{tr.churchServices.backToServices}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{tr.churchServices.serviceNotFound}</p>
            <Link href="/church-services" className="mt-4 inline-block">
              <Button variant="outline">{tr.churchServices.backToServices}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/church-services/${serviceId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{tr.churchServices.editService}</h1>
          <p className="text-muted-foreground mt-1">{service.serviceName}</p>
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
            <CardDescription>{tr.churchServices.updateInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">{tr.churchServices.serviceName}</Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => handleChange("serviceName", e.target.value)}
                placeholder={tr.churchServices.serviceNamePlaceholder}
                maxLength={150}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">{tr.churchServices.description}</Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) =>
                  handleChange("serviceDescription", e.target.value)
                }
                placeholder={tr.churchServices.descriptionPlaceholder}
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{tr.churchServices.serviceType}</Label>
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
              <Label htmlFor="leader">{tr.churchServices.leader}</Label>
              <Input
                id="leader"
                value={formData.leader}
                onChange={(e) => handleChange("leader", e.target.value)}
                placeholder={tr.common.optional}
              />
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
              <Label htmlFor="leadership_start">{tr.churchServices.leadershipStart}</Label>
              <Input
                id="leadership_start"
                type="date"
                value={formData.leadership_start}
                onChange={(e) =>
                  handleChange("leadership_start", e.target.value)
                }
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
          <Link href={`/church-services/${serviceId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              {tr.common.cancel}
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {loading ? tr.churchServices.saving : tr.churchServices.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  )
}

