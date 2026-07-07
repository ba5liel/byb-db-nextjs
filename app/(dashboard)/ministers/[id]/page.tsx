"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Edit,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react"
import {
  useMinister,
  useUpdateMinister,
  useUpdateMinisterStatus,
  useServices,
} from "@/lib/api/hooks"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { MinisterForm, type MinisterFormData } from "@/components/ministers/minister-form"
import { getMinisterMember } from "@/lib/api/types"
import type { MinisterStatus } from "@/lib/api/types"

const STATUS_VALUES: MinisterStatus[] = ["active", "inactive", "suspended", "retired"]

export default function MinisterDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const td = tr.ministers.detail

  const { data: ministerResponse, isLoading, isError } = useMinister(params.id)
  const { data: servicesData } = useServices()
  const updateMutation = useUpdateMinister()
  const statusMutation = useUpdateMinisterStatus()

  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<MinisterFormData>({})

  const minister = ministerResponse?.data
  const member = minister ? getMinisterMember(minister) : null

  const serviceNameById = new Map(
    (servicesData?.data || []).map((s: any) => [s._id, s.serviceName])
  )

  function openEdit() {
    if (!minister) return
    setFormData({
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
    setEditOpen(true)
  }

  async function handleUpdate() {
    if (!minister) return
    try {
      await updateMutation.mutateAsync({ id: minister._id, data: formData })
      toast({ title: tr.ministers.updateSuccess })
      setEditOpen(false)
    } catch {
      toast({ title: tr.ministers.updateError, variant: "destructive" })
    }
  }

  async function handleStatusChange(status: string) {
    if (!minister || status === minister.status) return
    try {
      await statusMutation.mutateAsync({ id: minister._id, status })
      toast({ title: td.statusChanged })
    } catch {
      toast({ title: td.statusChangeFailed, variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !minister) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => router.push("/ministers")}>
          <ArrowLeft className="w-4 h-4" />
          {td.backToList}
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {td.notFound}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => router.push("/ministers")}>
        <ArrowLeft className="w-4 h-4" />
        {td.backToList}
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{member?.fullName}</h1>
            <p className="text-muted-foreground">
              {minister.customRole || tr.ministers.roles[minister.role] || minister.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3" >
          <Select value={minister.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40" disabled={statusMutation.isPending}>
              <SelectValue placeholder={td.changeStatus} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {tr.ministers.statusOptions[s] || s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openEdit} className="gap-2">
            <Edit className="w-4 h-4" />
            {tr.common.edit}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ministerial info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {td.ministerialInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{tr.ministers.ordinationDate}:</span>
              <span className="font-medium">
                {new Date(minister.ordinationDate).toLocaleDateString()}
              </span>
            </div>
            {minister.ordainingBody && (
              <div className="text-sm">
                <span className="text-muted-foreground">{tr.ministers.ordainingBody}: </span>
                <span className="font-medium">{minister.ordainingBody}</span>
              </div>
            )}
            {minister.contractType && (
              <div className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">{tr.ministers.contractType}:</span>
                <Badge variant="outline">
                  {tr.ministers.contractTypes[minister.contractType] || minister.contractType}
                </Badge>
              </div>
            )}
            {minister.salary != null && (
              <div className="text-sm">
                <span className="text-muted-foreground">{tr.ministers.salary}: </span>
                <span className="font-medium">{minister.salary.toLocaleString()}</span>
              </div>
            )}
            {minister.statusEffectiveDate && (
              <div className="text-sm">
                <span className="text-muted-foreground">{td.statusEffectiveDate}: </span>
                <span className="font-medium">
                  {new Date(minister.statusEffectiveDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {minister.hasSystemAccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <User className="w-4 h-4" />
                <span>{tr.ministers.systemAccess}</span>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {tr.ministers.responsibilities}
              </p>
              <p className="text-sm">{minister.responsibilities}</p>
            </div>
          </CardContent>
        </Card>

        {/* Member info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {td.memberInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member ? (
              <>
                {member.membershipNumber && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{td.membershipNumber}: </span>
                    <span className="font-medium">{member.membershipNumber}</span>
                  </div>
                )}
                {member.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{member.phoneNumber}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{member.email}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href={`/members/${member._id}`}>
                    <User className="w-4 h-4" />
                    {td.viewMemberProfile}
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{td.notFound}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Departments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            {td.departments}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {minister.assignedDepartments && minister.assignedDepartments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {minister.assignedDepartments.map((deptId) => (
                <Badge key={deptId} variant="secondary">
                  {serviceNameById.get(deptId) || deptId}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{td.noDepartments}</p>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr.ministers.editMinister}</DialogTitle>
            <DialogDescription>{tr.ministers.editMinisterSubtitle}</DialogDescription>
          </DialogHeader>
          <MinisterForm
            formData={formData}
            onChange={setFormData}
            mode="edit"
            memberName={member?.fullName || ""}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {tr.common.cancel}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? tr.ministers.updating : tr.ministers.updateBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
