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
  Search,
  Shield,
  Calendar,
  AlertCircle,
  User,
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
import { Checkbox } from "@/components/ui/checkbox"
import { useMinisters, useCreateMinister, useUpdateMinister, useDeleteMinister, useSearchMembers } from "@/lib/api/hooks"
import { toast } from "@/hooks/use-toast"
import type { CreateMinisterDto, MinisterDto, MinisterRole, ContractType } from "@/lib/api/types"

const ministerRoles: { value: MinisterRole; label: string }[] = [
  { value: "pastor", label: "Pastor" },
  { value: "elder", label: "Elder" },
  { value: "deacon", label: "Deacon" },
  { value: "evangelist", label: "Evangelist" },
  { value: "teacher", label: "Teacher" },
  { value: "other", label: "Other" },
]

const contractTypes: { value: ContractType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "volunteer", label: "Volunteer" },
  { value: "contract", label: "Contract" },
]

export default function MinistersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMinister, setSelectedMinister] = useState<MinisterDto | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<CreateMinisterDto>>({
    memberId: "",
    role: "pastor",
    customRole: "",
    ordinationDate: "",
    ordinationCertificateUrl: "",
    ordainingBody: "",
    responsibilities: "",
    assignedDepartments: [],
    salary: undefined,
    contractType: "volunteer",
    hasSystemAccess: false,
    email: "",
    password: "",
    permissionRole: "",
  })

  const [memberSearch, setMemberSearch] = useState("")

  // API hooks
  const { data: ministersData, isLoading, error } = useMinisters({
    page: currentPage,
    limit: 10,
    role: roleFilter === "all" ? undefined : (roleFilter as MinisterRole),
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchTerm,
  })

  const { data: memberResults } = useSearchMembers(memberSearch, 5)

  const createMutation = useCreateMinister()
  const updateMutation = useUpdateMinister()
  const deleteMutation = useDeleteMinister()

  const ministers = ministersData?.data || []
  const pagination = ministersData?.pagination

  const handleCreateMinister = async () => {
    if (!formData.memberId || !formData.role || !formData.ordinationDate || !formData.responsibilities) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (formData.hasSystemAccess && (!formData.email || !formData.password)) {
      toast({
        title: "Validation Error",
        description: "Email and password are required when system access is enabled",
        variant: "destructive",
      })
      return
    }

    try {
      await createMutation.mutateAsync(formData as CreateMinisterDto)
      toast({
        title: "Success",
        description: "Minister created successfully",
      })
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create minister",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMinister = async () => {
    if (!selectedMinister) return

    try {
      await updateMutation.mutateAsync({
        id: selectedMinister._id,
        data: formData,
      })
      toast({
        title: "Success",
        description: "Minister updated successfully",
      })
      setEditDialogOpen(false)
      setSelectedMinister(null)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update minister",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMinister = async () => {
    if (!selectedMinister) return

    try {
      await deleteMutation.mutateAsync(selectedMinister._id)
      toast({
        title: "Success",
        description: "Minister deleted successfully",
      })
      setDeleteDialogOpen(false)
      setSelectedMinister(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete minister",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      memberId: "",
      role: "pastor",
      customRole: "",
      ordinationDate: "",
      ordinationCertificateUrl: "",
      ordainingBody: "",
      responsibilities: "",
      assignedDepartments: [],
      salary: undefined,
      contractType: "volunteer",
      hasSystemAccess: false,
      email: "",
      password: "",
      permissionRole: "",
    })
    setMemberSearch("")
  }

  const openEditDialog = (minister: MinisterDto) => {
    setSelectedMinister(minister)
    setFormData({
      memberId: minister.memberId,
      role: minister.role,
      customRole: minister.customRole,
      ordinationDate: minister.ordinationDate,
      ordinationCertificateUrl: minister.ordinationCertificateUrl,
      ordainingBody: minister.ordainingBody,
      responsibilities: minister.responsibilities,
      assignedDepartments: minister.assignedDepartments,
      salary: minister.salary,
      contractType: minister.contractType,
      hasSystemAccess: minister.hasSystemAccess,
      email: minister.email,
      permissionRole: minister.permissionRole,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (minister: MinisterDto) => {
    setSelectedMinister(minister)
    setDeleteDialogOpen(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load ministers</h2>
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
          <h1 className="text-4xl font-bold">Ministers & Leadership</h1>
          <p className="text-muted-foreground text-lg">Manage church ministers and leadership</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              Add Minister
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Minister</DialogTitle>
              <DialogDescription>Add a new minister or church leader</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="memberSearch">Select Member *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search for member..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                  {memberResults?.data && memberResults.data.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {memberResults.data.map((member) => (
                        <div
                          key={member._id}
                          className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setFormData({ ...formData, memberId: member._id })
                            setMemberSearch(member.fullName)
                          }}
                        >
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Minister Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as MinisterRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "other" && (
                <div>
                  <Label htmlFor="customRole">Custom Role</Label>
                  <Input
                    id="customRole"
                    value={formData.customRole}
                    onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                    placeholder="Enter custom role"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="ordinationDate">Ordination Date *</Label>
                <Input
                  id="ordinationDate"
                  type="date"
                  value={formData.ordinationDate ? new Date(formData.ordinationDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, ordinationDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="ordainingBody">Ordaining Body</Label>
                <Input
                  id="ordainingBody"
                  value={formData.ordainingBody}
                  onChange={(e) => setFormData({ ...formData, ordainingBody: e.target.value })}
                  placeholder="Church or organization"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="responsibilities">Responsibilities *</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Describe the minister's responsibilities"
                />
              </div>

              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData({ ...formData, contractType: value as ContractType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Monthly salary"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasSystemAccess"
                    checked={formData.hasSystemAccess}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasSystemAccess: checked as boolean })
                    }
                  />
                  <Label htmlFor="hasSystemAccess">Enable System Access</Label>
                </div>
              </div>

              {formData.hasSystemAccess && (
                <>
                  <div>
                    <Label htmlFor="email">Email for System Access *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="minister@church.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Secure password"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMinister} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Minister"}
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
                  placeholder="Search ministers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Minister Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ministerRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ministers Grid */}
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
          ministers.map((minister) => (
            <Card key={minister._id} variant="glass" hover="lift">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      {minister.memberName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {minister.customRole || minister.role.charAt(0).toUpperCase() + minister.role.slice(1)}
                    </CardDescription>
                  </div>
                  <Badge variant={minister.status === "active" ? "default" : "secondary"}>
                    {minister.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Ordained: {new Date(minister.ordinationDate).toLocaleDateString()}</span>
                  </div>

                  {minister.contractType && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {minister.contractType.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}

                  {minister.hasSystemAccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <User className="w-4 h-4" />
                      <span>System Access</span>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {minister.responsibilities}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(minister)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(minister)}
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
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} ministers
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

      {/* Edit Dialog - Similar structure to create dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Minister</DialogTitle>
            <DialogDescription>Update minister information</DialogDescription>
          </DialogHeader>
          {/* Similar form fields as create dialog */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMinister} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Minister"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Minister</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMinister?.memberName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMinister}
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
