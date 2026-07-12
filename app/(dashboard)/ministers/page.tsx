"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { useMinisters, useCreateMinister, useUpdateMinister, useDeleteMinister } from "@/lib/api/hooks"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { MinisterForm, type MinisterFormData } from "@/components/ministers/minister-form"
import { getMinisterMember } from "@/lib/api/types"
import type { CreateMinisterDto, MinisterDto, MinisterRole, MinisterStatus } from "@/lib/api/types"

const MINISTER_ROLE_VALUES: MinisterRole[] = ["pastor", "elder", "deacon", "evangelist", "teacher", "other"]

const EMPTY_FORM: MinisterFormData = {
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
}

export default function MinistersPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMinister, setSelectedMinister] = useState<MinisterDto | null>(null)
  const [formData, setFormData] = useState<MinisterFormData>(EMPTY_FORM)

  // API hooks
  const { data: ministersData, isLoading, error } = useMinisters({
    page: currentPage,
    limit: 10,
    role: roleFilter === "all" ? undefined : (roleFilter as MinisterRole),
    status: statusFilter === "all" ? undefined : (statusFilter as MinisterStatus),
    search: searchTerm,
  })

  const createMutation = useCreateMinister()
  const updateMutation = useUpdateMinister()
  const deleteMutation = useDeleteMinister()

  const ministers = ministersData?.data || []
  const pagination = ministersData?.pagination

  const memberNameOf = (minister: MinisterDto) =>
    getMinisterMember(minister)?.fullName || ""

  const handleCreateMinister = async () => {
    if (!formData.memberId || !formData.role || !formData.ordinationDate || !formData.responsibilities) {
      toast({
        title: tr.ministers.validationFillRequired,
        variant: "destructive",
      })
      return
    }

    if (formData.hasSystemAccess && (!formData.email || !formData.password)) {
      toast({
        title: tr.ministers.emailPasswordRequired,
        variant: "destructive",
      })
      return
    }

    try {
      await createMutation.mutateAsync(formData as CreateMinisterDto)
      toast({ title: tr.ministers.createSuccess })
      setCreateDialogOpen(false)
      setFormData(EMPTY_FORM)
    } catch (error) {
      toast({
        title: tr.ministers.createError,
        variant: "destructive",
      })
    }
  }

  const handleUpdateMinister = async () => {
    if (!selectedMinister) return

    // memberId cannot change; credentials are managed separately
    const { memberId, email, password, ...updatePayload } = formData

    try {
      await updateMutation.mutateAsync({
        id: selectedMinister._id,
        data: updatePayload,
      })
      toast({ title: tr.ministers.updateSuccess })
      setEditDialogOpen(false)
      setSelectedMinister(null)
      setFormData(EMPTY_FORM)
    } catch (error) {
      toast({
        title: tr.ministers.updateError,
        variant: "destructive",
      })
    }
  }

  const handleDeleteMinister = async () => {
    if (!selectedMinister) return

    try {
      await deleteMutation.mutateAsync(selectedMinister._id)
      toast({ title: tr.ministers.deleteSuccess })
      setDeleteDialogOpen(false)
      setSelectedMinister(null)
    } catch (error) {
      toast({
        title: tr.ministers.deleteError,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (minister: MinisterDto) => {
    setSelectedMinister(minister)
    setFormData({
      memberId: getMinisterMember(minister)?._id || (minister.memberId as string),
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
            <h2 className="text-2xl font-bold">{tr.ministers.failedToLoad}</h2>
            <p className="text-muted-foreground">{tr.ministers.refreshPage}</p>
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
          <h1 className="text-4xl font-bold">{tr.ministers.title}</h1>
          <p className="text-muted-foreground text-lg">{tr.ministers.subtitle}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              {tr.ministers.addMinister}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{tr.ministers.createMinister}</DialogTitle>
              <DialogDescription>{tr.ministers.createMinisterSubtitle}</DialogDescription>
            </DialogHeader>
            <MinisterForm formData={formData} onChange={setFormData} mode="create" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {tr.common.cancel}
              </Button>
              <Button onClick={handleCreateMinister} disabled={createMutation.isPending}>
                {createMutation.isPending ? tr.ministers.creating : tr.ministers.createBtn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>{tr.common.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={tr.ministers.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={tr.ministers.ministerRole} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.ministers.allRoles}</SelectItem>
                {MINISTER_ROLE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {tr.ministers.roles[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={tr.common.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tr.ministers.allStatus}</SelectItem>
                <SelectItem value="active">{tr.ministers.statusOptions.active}</SelectItem>
                <SelectItem value="on_leave">{tr.ministers.statusOptions.on_leave}</SelectItem>
                <SelectItem value="suspended">{tr.ministers.statusOptions.suspended}</SelectItem>
                <SelectItem value="retired">{tr.ministers.statusOptions.retired}</SelectItem>
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
            <Card
              key={minister._id}
              variant="glass"
              hover="lift"
              className="cursor-pointer"
              onClick={() => router.push(`/ministers/${minister._id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      {memberNameOf(minister)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {minister.customRole || tr.ministers.roles[minister.role] || minister.role}
                    </CardDescription>
                  </div>
                  <Badge variant={minister.status === "active" ? "default" : "secondary"}>
                    {tr.ministers.statusOptions[minister.status] || minister.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{tr.ministers.ordained}: {new Date(minister.ordinationDate).toLocaleDateString()}</span>
                  </div>

                  {minister.contractType && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {tr.ministers.contractTypes[minister.contractType] || minister.contractType}
                      </Badge>
                    </div>
                  )}

                  {minister.hasSystemAccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <User className="w-4 h-4" />
                      <span>{tr.ministers.systemAccess}</span>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {minister.responsibilities}
                  </div>

                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(minister)}>
                      <Edit className="w-4 h-4 mr-1" />
                      {tr.common.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(minister)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {tr.common.delete}
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
            {tr.ministers.showingOf
              .replace("{from}", String(((pagination.page - 1) * pagination.limit) + 1))
              .replace("{to}", String(Math.min(pagination.page * pagination.limit, pagination.total)))
              .replace("{total}", String(pagination.total))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {tr.common.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              {tr.common.next}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr.ministers.editMinister}</DialogTitle>
            <DialogDescription>{tr.ministers.editMinisterSubtitle}</DialogDescription>
          </DialogHeader>
          <MinisterForm
            formData={formData}
            onChange={setFormData}
            mode="edit"
            memberName={selectedMinister ? memberNameOf(selectedMinister) : ""}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {tr.common.cancel}
            </Button>
            <Button onClick={handleUpdateMinister} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? tr.ministers.updating : tr.ministers.updateBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.ministers.deleteMinister}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.ministers.deleteConfirm.replace("{name}", selectedMinister ? memberNameOf(selectedMinister) : "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMinister}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tr.ministers.deleting : tr.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
