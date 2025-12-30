"use client"

/**
 * Church Services List Page
 * 
 * Displays all church services/ministries with filtering and pagination.
 * Only accessible to superAdmin users.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Edit, Eye } from "lucide-react"
import { useChurchServices } from "@/lib/church-services-context"
import type { ServiceType } from "@/lib/types"

// Service type labels
const SERVICE_TYPE_LABELS: Record<ServiceType, { en: string; am: string }> = {
  worship: { en: "Worship", am: "አምልኮ" },
  evangelism: { en: "Evangelism", am: "ወንጌል" },
  social_service: { en: "Social Service", am: "ማህበራዊ አገልግሎት" },
  education: { en: "Education", am: "ትምህርት" },
  youth: { en: "Youth", am: "ወጣቶች" },
  children: { en: "Children", am: "ሕፃናት" },
  prayer: { en: "Prayer", am: "ጸሎት" },
  media: { en: "Media", am: "ሚዲያ" },
  administration: { en: "Administration", am: "አስተዳደር" },
  other: { en: "Other", am: "ሌላ" },
}

export default function ChurchServicesPage() {
  const { services, loading, error, fetchServices } = useChurchServices()
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch services on mount and when filters change
  useEffect(() => {
    const filters = {
      ...(typeFilter !== "all" && { type: typeFilter as ServiceType }),
      ...(statusFilter !== "all" && { status: statusFilter === "active" }),
      page,
      limit,
    }
    fetchServices(Object.keys(filters).length > 0 ? filters : undefined)
  }, [typeFilter, statusFilter, page, fetchServices])

  // Filter services by search term (client-side)
  const filteredServices = services.filter((service) => {
    const matchesSearch = 
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusFilter, searchTerm])

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Church Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage church services and ministries
          </p>
        </div>
        <Link href="/church-services/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Service
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No services found.</p>
            <Link href="/church-services/new" className="mt-4 inline-block">
              <Button variant="outline">Create First Service</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{service.serviceName}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">
                        {SERVICE_TYPE_LABELS[service.type]?.en || service.type}
                      </Badge>
                      <Badge variant={service.status ? "default" : "secondary"}>
                        {service.status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {service.serviceDescription}
                </p>
                
                {/* Service Stats */}
                <div className="space-y-2 text-sm mb-4">
                  {service.currentMemberCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Members:</span>
                      <span className="font-medium">{service.currentMemberCount}</span>
                    </div>
                  )}
                  {service.maximum_members_allowed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">
                        {service.maximum_members_allowed}
                      </span>
                    </div>
                  )}
                  {service.availableSlots !== null && service.availableSlots !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium">{service.availableSlots}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/church-services/${service._id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/church-services/${service._id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

