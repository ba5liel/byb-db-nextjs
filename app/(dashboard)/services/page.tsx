"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Users,
  Calendar,
  MapPin,
  AlertCircle,
  UserPlus,
  UserMinus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useServices, useCreateService, useUpdateService, useDeleteService, useSearchMembers } from "@/lib/api/hooks"
import { toast } from "@/hooks/use-toast"
import type { CreateServiceDto, ServiceDto, ServiceType } from "@/lib/api/types"

const serviceTypes: { value: ServiceType; label: string }[] = [
  { value: "worship", label: "Worship" },
  { value: "evangelism", label: "Evangelism" },
  { value: "teaching", label: "Teaching" },
  { value: "prayer", label: "Prayer" },
  { value: "youth", label: "Youth" },
  { value: "children", label: "Children" },
  { value: "media", label: "Media" },
  { value: "administration", label: "Administration" },
  { value: "other", label: "Other" },
]

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<CreateServiceDto>>({
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

  const [leaderSearch, setLeaderSearch] = useState("")
  const [secretarySearch, setSecretarySearch] = useState("")

  // API hooks
  const { data: servicesData, isLoading, error } = useServices({
    page: currentPage,
    limit: 10,
    type: typeFilter === "all" ? undefined : (typeFilter as ServiceType),
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const { data: leaderResults } = useSearchMembers(leaderSearch, 5)
  const { data: secretaryResults } = useSearchMembers(secretarySearch, 5)

  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const deleteMutation = useDeleteService()

  const services = servicesData?.data || []
  const pagination = servicesData?.pagination

  const handleCreateService = async () => {
    if (!formData.serviceName || !formData.serviceDescription || !formData.leader || !formData.leadership_start) {
        toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

    try {
      await createMutation.mutateAsync(formData as CreateServiceDto)
      toast({
        title: "Success",
        description: "Service created successfully",
      })
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      })
    }
  }

  const handleUpdateService = async () => {
    if (!selectedService) return

    try {
      await updateMutation.mutateAsync({
        id: selectedService._id,
        data: formData,
      })
      toast({
        title: "Success",
        description: "Service updated successfully",
      })
      setEditDialogOpen(false)
      setSelectedService(null)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      })
    }
  }

  const handleDeleteService = async () => {
    if (!selectedService) return

    try {
      await deleteMutation.mutateAsync(selectedService._id)
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
      setDeleteDialogOpen(false)
      setSelectedService(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
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
    setLeaderSearch("")
    setSecretarySearch("")
  }

  const openEditDialog = (service: ServiceDto) => {
    setSelectedService(service)
    setFormData({
      serviceName: service.serviceName,
      serviceDescription: service.serviceDescription,
      type: service.type,
      leader: service.leader,
      secretary: service.secretary,
      leadership_start: service.leadership_start,
      leadership_end: service.leadership_end,
      maximum_members_allowed: service.maximum_members_allowed,
      meeting_schedule: service.meeting_schedule,
      meeting_location: service.meeting_location,
      status: service.status,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (service: ServiceDto) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load services</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Church Services</h1>
          <p className="text-muted-foreground text-lg">Manage church ministries and services</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>Add a new church service or ministry</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  placeholder="የአምልኮ አገልግሎት"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="serviceDescription">Description *</Label>
                <Textarea
                  id="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                  placeholder="የእምነት አገልግሎት እና መዝሙር"
                />
              </div>
              <div>
                <Label htmlFor="type">Service Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as ServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maximum_members_allowed">Max Members</Label>
                <Input
                  id="maximum_members_allowed"
                  type="number"
                  value={formData.maximum_members_allowed || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maximum_members_allowed: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="leadership_start">Leadership Start *</Label>
                <Input
                  id="leadership_start"
                  type="date"
                  value={formData.leadership_start ? new Date(formData.leadership_start).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, leadership_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="leadership_end">Leadership End</Label>
                <Input
                  id="leadership_end"
                  type="date"
                  value={formData.leadership_end ? new Date(formData.leadership_end).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, leadership_end: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="meeting_schedule">Meeting Schedule</Label>
                <Input
                  id="meeting_schedule"
                  value={formData.meeting_schedule}
                  onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                  placeholder="Every Sunday 2:00 PM"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="meeting_location">Meeting Location</Label>
                <Input
                  id="meeting_location"
                  value={formData.meeting_location}
                  onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                  placeholder="Main Hall, Room 3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateService} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>

      {/* Filters */}
      <Card variant="glass">
          <CardHeader>
          <CardTitle>Filters</CardTitle>
          </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} variant="glass">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          services.map((service) => (
            <Card key={service._id} variant="glass" hover="lift">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                    <CardDescription className="mt-1">{service.serviceDescription}</CardDescription>
                  </div>
                  <Badge variant={service.status ? "default" : "secondary"}>
                    {service.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="capitalize">
                      {service.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      {service.currentMemberCount || 0}
                      {service.maximum_members_allowed && ` / ${service.maximum_members_allowed}`} members
                    </span>
                  </div>

                  {service.meeting_schedule && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{service.meeting_schedule}</span>
                    </div>
                  )}

                  {service.meeting_location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{service.meeting_location}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(service)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(service)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
              </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} services
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-serviceName">Service Name *</Label>
              <Input
                id="edit-serviceName"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-serviceDescription">Description *</Label>
              <Textarea
                id="edit-serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Service Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ServiceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-maximum_members_allowed">Max Members</Label>
              <Input
                id="edit-maximum_members_allowed"
                type="number"
                value={formData.maximum_members_allowed || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maximum_members_allowed: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateService} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Service"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedService?.serviceName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}