"use client"

/**
 * System Admin Users List Page
 * 
 * Displays all admin users with filtering, search, and pagination.
 * Requires user:list permission to view.
 * Actions require additional permissions (create, update, delete, ban).
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Plus, Search, MoreVertical, Edit, Eye, Trash2, Lock, Unlock } from "lucide-react"
import { useSystemAdmin } from "@/lib/system-admin-context"
import { usePermissions } from "@/lib/use-permissions"
import type { AdminUser, AdminUserRole, AdminUserStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

// Role labels
const ROLE_LABELS: Record<AdminUserRole, string> = {
  superAdmin: "Super Admin",
  admin: "Admin",
  ministerAdmin: "Minister Admin",
  serviceManager: "Service Manager",
  reportViewer: "Report Viewer",
  dataEntry: "Data Entry",
  user: "User",
}

// Status badge variants
const STATUS_VARIANTS: Record<AdminUserStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  locked: "destructive",
  pending_activation: "outline",
}

export default function SystemAdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.systemAdminUsers
  const { users, loading, error, fetchUsers, deleteUser, lockAccount, unlockAccount } = useSystemAdmin()
  const { checkPermission } = usePermissions()

  // Permission states
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [canBan, setCanBan] = useState(false)

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [userToAction, setUserToAction] = useState<AdminUser | null>(null)

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      setCanCreate(await checkPermission({ user: ["create"] }))
      setCanUpdate(await checkPermission({ user: ["update"] }))
      setCanDelete(await checkPermission({ user: ["delete"] }))
      setCanBan(await checkPermission({ user: ["ban"] }))
    }
    checkPermissions()
  }, [checkPermission])

  // Fetch users on mount and when filters change
  useEffect(() => {
    const filters = {
      ...(searchTerm && { search: searchTerm }),
      ...(roleFilter !== "all" && { role: roleFilter as AdminUserRole }),
      ...(statusFilter !== "all" && { status: statusFilter as AdminUserStatus }),
      page,
      limit,
      includeDeleted: false,
    }
    fetchUsers(filters).then((response) => {
      if (response?.pagination?.pages) {
        setTotalPages(response.pagination.pages)
      } else if (response?.pagination) {
        // Calculate pages from total and limit if pages is missing
        const limit = filters.limit || 20
        const total = response.pagination.total || 0
        setTotalPages(Math.ceil(total / limit) || 1)
      }
    })
  }, [roleFilter, statusFilter, page, searchTerm, fetchUsers])

  // Handle delete
  const handleDelete = async () => {
    if (!userToAction) return
    try {
      await deleteUser(userToAction._id)
      toast({
        title: t.success,
        description: t.userDeleted,
      })
      setDeleteDialogOpen(false)
      setUserToAction(null)
      // Refresh list
      const filters = {
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter as AdminUserRole }),
        ...(statusFilter !== "all" && { status: statusFilter as AdminUserStatus }),
        page,
        limit,
      }
      fetchUsers(filters)
    } catch (err) {
      toast({
        title: t.errorTitle,
        description: err instanceof Error ? err.message : t.deleteFailed,
        variant: "destructive",
      })
    }
  }

  // Handle lock/unlock
  const handleLock = async () => {
    if (!userToAction) return
    try {
      if (userToAction.status === "locked") {
        await unlockAccount(userToAction._id)
        toast({
          title: t.success,
          description: t.accountUnlocked,
        })
      } else {
        await lockAccount(userToAction._id, {
          reason: "Manual lock by administrator",
        })
        toast({
          title: t.success,
          description: t.accountLocked,
        })
      }
      setLockDialogOpen(false)
      setUserToAction(null)
      // Refresh list
      const filters = {
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter as AdminUserRole }),
        ...(statusFilter !== "all" && { status: statusFilter as AdminUserStatus }),
        page,
        limit,
      }
      fetchUsers(filters)
    } catch (err) {
      toast({
        title: t.errorTitle,
        description: err instanceof Error ? err.message : t.statusUpdateFailed,
        variant: "destructive",
      })
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return t.never
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        {canCreate && (
          <Link href="/system-admin/users/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.newUser}
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{tr.common.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchUsers}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder={t.allRoles} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allRoles}</SelectItem>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder={t.allStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="active">{t.statusActive}</SelectItem>
                <SelectItem value="inactive">{t.statusInactive}</SelectItem>
                <SelectItem value="locked">{t.statusLocked}</SelectItem>
                <SelectItem value="pending_activation">{t.statusPending}</SelectItem>
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

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{t.noUsers}</p>
            {canCreate && (
              <Link href="/system-admin/users/new" className="mt-4 inline-block">
                <Button variant="outline">{t.createFirstUser}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.username}</TableHead>
                    <TableHead>{t.fullName}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.role}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.lastLogin}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.roleLabels[user.role] || user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[user.status]}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/system-admin/users/${user._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t.view}
                              </Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem asChild>
                                <Link href={`/system-admin/users/${user._id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {tr.common.edit}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canBan && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToAction(user)
                                  setLockDialogOpen(true)
                                }}
                              >
                                {user.status === "locked" ? (
                                  <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    {t.unlock}
                                  </>
                                ) : (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    {t.lock}
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setUserToAction(user)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {tr.common.delete}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {tr.common.previous}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {tr.common.next}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteUserTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteUserDesc.replace("{name}", userToAction?.fullName ?? "")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {tr.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock/Unlock Confirmation Dialog */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToAction?.status === "locked" ? t.unlockUserTitle : t.lockUserTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>{(userToAction?.status === "locked" ? t.unlockConfirm : t.lockConfirm).replace("{name}", userToAction?.fullName ?? "")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLock}>
              {userToAction?.status === "locked" ? t.unlock : t.lock}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

