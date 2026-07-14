"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  AlertCircle,
  Check,
  X,
  LayoutGrid,
  Table as TableIcon,
  MoreHorizontal,
  ChevronsUpDown,
  Shield,
} from "lucide-react"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Resource, Action } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useMinisters, useCreateMinister, useUpdateMinister, useDeleteMinister } from "@/lib/api/hooks"
import { searchMembers } from "@/lib/members-api"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import type {
  CreateMinisterDto,
  MinisterDto,
  MinisterRole,
  MinisterStatus,
  ContractType,
} from "@/lib/api/types"

const PAGE_SIZE = 10

const ministerRoles: MinisterRole[] = [
  "pastor",
  "apostle",
  "evangelist",
  "elder",
  "deacon",
  "deaconess",
  "youth_leader",
  "other",
]

const contractTypes: ContractType[] = ["full_time", "part_time", "volunteer"]
const ministerStatuses: MinisterStatus[] = ["active", "on_leave", "suspended", "retired"]

/** Minimal member shape used by the combobox / selected display. */
interface SelectedMember {
  _id: string
  fullName: string
  membershipNumber?: string
}

const emptyForm: Partial<CreateMinisterDto> = {
  memberId: "",
  role: "pastor",
  customRole: "",
  ordinationDate: "",
  ordinationCertificateUrl: "",
  responsibilities: "",
  assignedDepartments: [],
  salary: undefined,
  contractType: "volunteer",
  hasSystemAccess: false,
  email: "",
  password: "",
  permissionRole: "",
}

/**
 * Debounced, server-side member search combobox.
 *
 * Selecting a result stores the member id on the form and shows the chosen
 * member in the trigger; the popover closes and can be reopened to change.
 */
function MemberCombobox({
  selected,
  onSelect,
  onClear,
  t,
}: {
  selected: SelectedMember | null
  onSelect: (member: SelectedMember) => void
  onClear: () => void
  t: ReturnType<typeof getTranslation>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [results, setResults] = useState<SelectedMember[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce the raw input (300ms) before hitting the API.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    let active = true
    if (debounced.length === 0) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    searchMembers(debounced, 8)
      .then((data) => {
        if (active) setResults(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setResults([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [debounced])

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{selected.fullName}</span>
                {selected.membershipNumber && (
                  <span className="text-xs text-muted-foreground">{selected.membershipNumber}</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{t.ministers.selectMember}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={t.ministers.searchMemberPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">…</div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {debounced ? t.ministers.noMembersFound : t.ministers.searchMemberPlaceholder}
              </div>
            ) : (
              results.map((member) => {
                const isSelected = selected?._id === member._id
                return (
                  <button
                    type="button"
                    key={member._id}
                    onClick={() => {
                      onSelect(member)
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{member.fullName}</div>
                      {member.membershipNumber && (
                        <div className="truncate text-xs text-muted-foreground">
                          {member.membershipNumber}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          onClick={onClear}
          aria-label={t.ministers.change}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function MinistersPage() {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { hasPermission } = useAuth()

  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [view, setView] = useState<"table" | "card">("table")

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMinister, setSelectedMinister] = useState<MinisterDto | null>(null)

  const [formData, setFormData] = useState<Partial<CreateMinisterDto>>(emptyForm)
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null)

  // Debounce the search box before it feeds the query.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data: ministersData, isLoading, error } = useMinisters({
    page: currentPage,
    limit: PAGE_SIZE,
    role: roleFilter === "all" ? undefined : (roleFilter as MinisterRole),
    status: statusFilter === "all" ? undefined : (statusFilter as MinisterStatus),
    search: searchTerm || undefined,
  })

  const createMutation = useCreateMinister()
  const updateMutation = useUpdateMinister()
  const deleteMutation = useDeleteMinister()

  const ministers = ministersData?.data || []
  const pagination = ministersData?.pagination

  const resetForm = () => {
    setFormData(emptyForm)
    setSelectedMember(null)
  }

  /** Build a payload that only carries fields the backend DTO accepts. */
  const buildPayload = (forUpdate = false): CreateMinisterDto => {
    const payload: Record<string, unknown> = {
      memberId: formData.memberId,
      role: formData.role,
      ordinationDate: formData.ordinationDate,
      hasSystemAccess: !!formData.hasSystemAccess,
    }
    if (formData.role === "other" && formData.customRole) payload.customRole = formData.customRole
    if (formData.responsibilities) payload.responsibilities = formData.responsibilities
    if (formData.contractType) payload.contractType = formData.contractType
    if (formData.ordinationCertificateUrl) payload.ordinationCertificateUrl = formData.ordinationCertificateUrl
    if (formData.assignedDepartments?.length) payload.assignedDepartments = formData.assignedDepartments
    if (formData.salary != null && !Number.isNaN(formData.salary)) payload.salary = formData.salary
    if (formData.hasSystemAccess) {
      if (formData.email) payload.email = formData.email
      // On update we only resend the password when the admin typed a new one.
      if (formData.password || !forUpdate) payload.password = formData.password
      if (formData.permissionRole) payload.permissionRole = formData.permissionRole
    }
    return payload as unknown as CreateMinisterDto
  }

  const handleCreateMinister = async () => {
    if (!formData.memberId || !formData.role || !formData.ordinationDate) {
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
      await createMutation.mutateAsync(buildPayload())
      toast({ title: "Success", description: "Minister created successfully" })
      setCreateDialogOpen(false)
      resetForm()
    } catch {
      toast({ title: "Error", description: "Failed to create minister", variant: "destructive" })
    }
  }

  const handleUpdateMinister = async () => {
    if (!selectedMinister) return
    try {
      await updateMutation.mutateAsync({ id: selectedMinister._id, data: buildPayload(true) })
      toast({ title: "Success", description: "Minister updated successfully" })
      setEditDialogOpen(false)
      setSelectedMinister(null)
      resetForm()
    } catch {
      toast({ title: "Error", description: "Failed to update minister", variant: "destructive" })
    }
  }

  const handleDeleteMinister = async () => {
    if (!selectedMinister) return
    try {
      await deleteMutation.mutateAsync(selectedMinister._id)
      toast({ title: "Success", description: "Minister deleted successfully" })
      setDeleteDialogOpen(false)
      setSelectedMinister(null)
    } catch {
      toast({ title: "Error", description: "Failed to delete minister", variant: "destructive" })
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  const openEditDialog = (minister: MinisterDto) => {
    setSelectedMinister(minister)
    const member = getMember(minister)
    setSelectedMember(member)
    setFormData({
      memberId: member?._id || "",
      role: minister.role,
      customRole: minister.customRole,
      ordinationDate: minister.ordinationDate,
      ordinationCertificateUrl: minister.ordinationCertificateUrl,
      responsibilities: minister.responsibilities,
      assignedDepartments: minister.assignedDepartments,
      salary: minister.salary,
      contractType: minister.contractType,
      hasSystemAccess: minister.hasSystemAccess,
      email: minister.email,
      password: "",
      permissionRole: minister.permissionRole,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (minister: MinisterDto) => {
    setSelectedMinister(minister)
    setDeleteDialogOpen(true)
  }

  const roleLabel = (minister: MinisterDto) =>
    minister.role === "other" && minister.customRole
      ? minister.customRole
      : t.ministers.roleLabels[minister.role] || minister.role

  const contractLabel = (type?: ContractType) => {
    if (type === "full_time") return t.ministers.fullTime
    if (type === "part_time") return t.ministers.partTime
    if (type === "volunteer") return t.ministers.volunteer
    return null
  }

  const statusBadge = (status: MinisterStatus) => {
    const map: Record<MinisterStatus, { cls: string; label: string }> = {
      active: {
        cls: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        label: t.ministers.active,
      },
      on_leave: {
        cls: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        label: t.ministers.onLeave,
      },
      suspended: {
        cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        label: t.ministers.suspended,
      },
      retired: {
        cls: "bg-muted text-muted-foreground",
        label: t.ministers.retired,
      },
    }
    const conf = map[status] || map.active
    return <Badge className={`${conf.cls} hover:${conf.cls} border-0 font-medium`}>{conf.label}</Badge>
  }

  const formatDate = (value?: Date | string) =>
    value ? new Date(value).toLocaleDateString() : "—"

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">{t.ministers.failedToLoad}</h2>
            <p className="text-muted-foreground">
              {locale === "am" ? "እባክዎ ገጹን ያድሱ" : "Please try refreshing the page"}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const formFields = (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label>
          {t.ministers.selectMember} <span className="text-destructive">*</span>
        </Label>
        <div className="mt-1.5">
          <MemberCombobox
            selected={selectedMember}
            onSelect={(member) => {
              setSelectedMember(member)
              setFormData((prev) => ({ ...prev, memberId: member._id }))
            }}
            onClear={() => {
              setSelectedMember(null)
              setFormData((prev) => ({ ...prev, memberId: "" }))
            }}
            t={t}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="role">
          {t.ministers.role} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value as MinisterRole })}
        >
          <SelectTrigger id="role" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ministerRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {t.ministers.roleLabels[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.role === "other" && (
        <div>
          <Label htmlFor="customRole">{t.ministers.customRole}</Label>
          <Input
            id="customRole"
            className="mt-1.5"
            value={formData.customRole || ""}
            onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
            placeholder={t.ministers.customRolePlaceholder}
          />
        </div>
      )}

      <div>
        <Label htmlFor="ordinationDate">
          {t.ministers.ordinationDate} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ordinationDate"
          type="date"
          className="mt-1.5"
          value={formData.ordinationDate ? new Date(formData.ordinationDate).toISOString().split("T")[0] : ""}
          onChange={(e) => setFormData({ ...formData, ordinationDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="contractType">{t.ministers.type}</Label>
        <Select
          value={formData.contractType}
          onValueChange={(value) => setFormData({ ...formData, contractType: value as ContractType })}
        >
          <SelectTrigger id="contractType" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contractTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {contractLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label htmlFor="responsibilities">{t.ministers.responsibilities}</Label>
        <Textarea
          id="responsibilities"
          className="mt-1.5"
          value={formData.responsibilities || ""}
          onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
          placeholder={t.ministers.responsibilitiesPlaceholder}
        />
      </div>

      <div>
        <Label htmlFor="salary">{t.ministers.salary}</Label>
        <Input
          id="salary"
          type="number"
          className="mt-1.5"
          value={formData.salary ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              salary: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder={t.ministers.salaryPlaceholder}
        />
      </div>

      <div className="col-span-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSystemAccess"
            checked={formData.hasSystemAccess}
            onCheckedChange={(checked) => setFormData({ ...formData, hasSystemAccess: checked as boolean })}
          />
          <Label htmlFor="hasSystemAccess">{t.ministers.systemAccess}</Label>
        </div>
      </div>

      {formData.hasSystemAccess && (
        <>
          <div>
            <Label htmlFor="email">
              {t.ministers.email} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t.ministers.emailPlaceholder}
            />
          </div>
          <div>
            <Label htmlFor="password">
              {t.ministers.password} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              className="mt-1.5"
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t.ministers.passwordPlaceholder}
            />
          </div>
        </>
      )}
    </div>
  )

  const actionsMenu = (minister: MinisterDto) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">{t.ministers.actions}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t.ministers.actions}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasPermission(Resource.MINISTER, Action.UPDATE) && (
          <DropdownMenuItem onClick={() => openEditDialog(minister)}>
            <Edit className="w-4 h-4 mr-2" />
            {t.ministers.edit}
          </DropdownMenuItem>
        )}
        {hasPermission(Resource.MINISTER, Action.DELETE) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => openDeleteDialog(minister)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.ministers.delete}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <PermissionGuard resource={Resource.MINISTER} action={Action.READ}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.ministers.title}</h1>
            <p className="text-sm text-muted-foreground">{t.ministers.subtitle}</p>
          </div>
          {hasPermission(Resource.MINISTER, Action.CREATE) && (
            <Button size="sm" className="gap-2" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" />
              {t.ministers.addMinister}
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.ministers.search}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 bg-card"
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] bg-card">
              <SelectValue placeholder={t.ministers.role} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.ministers.allRoles}</SelectItem>
              {ministerRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {t.ministers.roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] bg-card">
              <SelectValue placeholder={t.ministers.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.ministers.allStatuses}</SelectItem>
              {ministerStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "active"
                    ? t.ministers.active
                    : status === "on_leave"
                      ? t.ministers.onLeave
                      : status === "suspended"
                        ? t.ministers.suspended
                        : t.ministers.retired}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-card p-0.5">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("table")}
              aria-label={t.ministers.tableView}
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("card")}
              aria-label={t.ministers.cardView}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table view */}
        {view === "table" ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t.ministers.minister}</TableHead>
                    <TableHead>{t.ministers.role}</TableHead>
                    <TableHead>{t.ministers.type}</TableHead>
                    <TableHead>{t.ministers.assignedDepartments}</TableHead>
                    <TableHead>{t.ministers.status}</TableHead>
                    <TableHead>{t.ministers.ordinationDate}</TableHead>
                    <TableHead className="w-[52px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3.5 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-3.5 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : ministers.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7}>
                        <div className="text-center py-14">
                          <Shield className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                          <h3 className="text-sm font-semibold mb-1">{t.ministers.noMinisters}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t.ministers.noMinistersDescription}
                          </p>
                          {hasPermission(Resource.MINISTER, Action.CREATE) && (
                            <Button size="sm" className="gap-2" onClick={openCreateDialog}>
                              <Plus className="w-4 h-4" />
                              {t.ministers.addMinister}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ministers.map((minister) => {
                      const member = getMember(minister)
                      const name = member?.fullName || minister.memberName || "—"
                      return (
                        <TableRow key={minister._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{name}</p>
                                <p className="text-xs text-muted-foreground truncate">{roleLabel(minister)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{roleLabel(minister)}</TableCell>
                          <TableCell>
                            {contractLabel(minister.contractType) ? (
                              <Badge variant="outline" className="font-normal">
                                {contractLabel(minister.contractType)}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {minister.assignedDepartments?.length || 0}
                          </TableCell>
                          <TableCell>{statusBadge(minister.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(minister.ordinationDate)}
                          </TableCell>
                          <TableCell className="text-right">{actionsMenu(minister)}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          /* Card view */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </Card>
              ))
            ) : ministers.length === 0 ? (
              <Card className="col-span-full p-14 text-center">
                <Shield className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">{t.ministers.noMinisters}</h3>
                <p className="text-sm text-muted-foreground">{t.ministers.noMinistersDescription}</p>
              </Card>
            ) : (
              ministers.map((minister) => {
                const member = getMember(minister)
                const name = member?.fullName || minister.memberName || "—"
                return (
                  <Card key={minister._id} className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{roleLabel(minister)}</p>
                        </div>
                      </div>
                      {actionsMenu(minister)}
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        {statusBadge(minister.status)}
                        {contractLabel(minister.contractType) && (
                          <Badge variant="outline" className="font-normal">
                            {contractLabel(minister.contractType)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t.ministers.ordained}: {formatDate(minister.ordinationDate)}
                        </span>
                      </div>
                      {minister.responsibilities && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {minister.responsibilities}
                        </p>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {locale === "am"
                ? `ከ${pagination.total} ${ministers.length} ማሳየት`
                : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )} of ${pagination.total}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {locale === "am" ? "ቀዳሚ" : "Previous"}
              </Button>
              <span className="text-sm text-muted-foreground px-1">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= pagination.pages}
              >
                {locale === "am" ? "ቀጣይ" : "Next"}
              </Button>
            </div>
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) resetForm() }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.ministers.createTitle}</DialogTitle>
              <DialogDescription>{t.ministers.createSubtitle}</DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t.ministers.cancel}
              </Button>
              <Button onClick={handleCreateMinister} disabled={createMutation.isPending}>
                {createMutation.isPending ? t.ministers.creating : t.ministers.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setSelectedMinister(null); resetForm() } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.ministers.editTitle}</DialogTitle>
              <DialogDescription>{t.ministers.editSubtitle}</DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t.ministers.cancel}
              </Button>
              <Button onClick={handleUpdateMinister} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.ministers.updating : t.ministers.update}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.ministers.deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.ministers.deleteConfirmation}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.ministers.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMinister}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? t.ministers.deleting : t.ministers.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}

/** Resolve the populated member object from a minister response, if present. */
function getMember(minister: MinisterDto): SelectedMember | null {
  const m = minister.memberId
  if (m && typeof m === "object") {
    return { _id: m._id, fullName: m.fullName, membershipNumber: m.membershipNumber }
  }
  if (minister.memberName) {
    return { _id: typeof m === "string" ? m : "", fullName: minister.memberName }
  }
  return null
}
