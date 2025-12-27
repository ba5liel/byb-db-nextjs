"use client"

/**
 * Church Service Detail Page
 * 
 * Displays detailed information about a church service and allows
 * member enrollment/exit operations.
 * Only accessible to superAdmin users.
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit, UserPlus, UserMinus } from "lucide-react"
import { useChurchServices } from "@/lib/church-services-context"
import * as churchServicesAPI from "@/lib/church-services-api"
import type { ServiceType } from "@/lib/types"

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  worship: "Worship (አምልኮ)",
  evangelism: "Evangelism (ወንጌል)",
  social_service: "Social Service (ማህበራዊ አገልግሎት)",
  education: "Education (ትምህርት)",
  youth: "Youth (ወጣቶች)",
  children: "Children (ሕፃናት)",
  prayer: "Prayer (ጸሎት)",
  media: "Media (ሚዲያ)",
  administration: "Administration (አስተዳደር)",
  other: "Other (ሌላ)",
}

export default function ChurchServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string

  const { getService, loading, error } = useChurchServices()
  const [service, setService] = useState<any>(null)

  // Fetch service details
  useEffect(() => {
    if (serviceId) {
      getService(serviceId).then(setService)
    }
  }, [serviceId, getService])

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
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
              <Button variant="outline">Back to Services</Button>
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
            <p className="text-muted-foreground">Service not found</p>
            <Link href="/church-services" className="mt-4 inline-block">
              <Button variant="outline">Back to Services</Button>
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
        <Link href="/church-services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{service.serviceName}</h1>
          <p className="text-muted-foreground mt-1">
            {SERVICE_TYPE_LABELS[service.type] || service.type}
          </p>
        </div>
        <Link href={`/church-services/${serviceId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Service Details */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={service.status ? "default" : "secondary"}>
                {service.status ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <span className="text-sm font-medium">Description:</span>
              <p className="text-muted-foreground mt-1">
                {service.serviceDescription}
              </p>
            </div>

            {/* Leader */}
            <div>
              <span className="text-sm font-medium">Leader:</span>
              <p className="text-muted-foreground mt-1">
                {typeof service.leader === "object"
                  ? service.leader.fullName || service.leader._id
                  : service.leader}
              </p>
            </div>

            {/* Secretary */}
            {service.secretary && (
              <div>
                <span className="text-sm font-medium">Secretary:</span>
                <p className="text-muted-foreground mt-1">
                  {typeof service.secretary === "object"
                    ? service.secretary.fullName || service.secretary._id
                    : service.secretary}
                </p>
              </div>
            )}

            {/* Leadership Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Leadership Start:</span>
                <p className="text-muted-foreground mt-1">
                  {formatDate(service.leadership_start)}
                </p>
              </div>
              {service.leadership_end && (
                <div>
                  <span className="text-sm font-medium">Leadership End:</span>
                  <p className="text-muted-foreground mt-1">
                    {formatDate(service.leadership_end)}
                  </p>
                </div>
              )}
            </div>

            {/* Meeting Info */}
            {service.meeting_schedule && (
              <div>
                <span className="text-sm font-medium">Meeting Schedule:</span>
                <p className="text-muted-foreground mt-1">
                  {service.meeting_schedule}
                </p>
              </div>
            )}

            {service.meeting_location && (
              <div>
                <span className="text-sm font-medium">Meeting Location:</span>
                <p className="text-muted-foreground mt-1">
                  {service.meeting_location}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Member Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Members</p>
                <p className="text-2xl font-bold">
                  {service.currentMemberCount ?? 0}
                </p>
              </div>
              {service.maximum_members_allowed && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-2xl font-bold">
                    {service.maximum_members_allowed}
                  </p>
                </div>
              )}
              {service.availableSlots !== null &&
                service.availableSlots !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">
                      {service.availableSlots}
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {service.status && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>
                Enroll or exit members from this service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/church-services/${serviceId}/enroll?memberId=`
                    )
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Member
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/church-services/${serviceId}/exit?memberId=`)
                  }
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Exit Member
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

