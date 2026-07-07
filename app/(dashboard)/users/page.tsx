"use client"

import { useState } from "react"
import { Plus, Search, Shield, Mail, Ban, Lock, Trash2, Edit, Key, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useAssignRole,
  useResetUserPassword,
  useRevokeUserSessions,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
  useRoles,
} from "@/lib/api/hooks"
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/permissions"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { PasswordInput } from "@/components/ui/password-input"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

// Form schemas
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1, "Please select a role"),
})

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  sendEmail: z.boolean().optional(),
})

const banUserSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters"),
})

export default function UsersPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Queries
  const { data: usersData, isLoading } = useUsers()
  const { data: rolesData } = useRoles()

  // Mutations
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const assignRole = useAssignRole()
  const resetPassword = useResetUserPassword()
  const revokeSessionsMutation = useRevokeUserSessions()
  const banUserMutation = useBanUser()
  const unbanUser = useUnbanUser()
  const deleteUser = useDeleteUser()

  // Forms
  const createForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
    },
  })

  const updateForm = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
  })

  const passwordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      sendEmail: true,
    },
  })

  const banForm = useForm<z.infer<typeof banUserSchema>>({
    resolver: zodResolver(banUserSchema),
  })

  // Filter users
  const users = usersData?.users || []
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handlers
  const handleCreateUser = (values: z.infer<typeof createUserSchema>) => {
    createUser.mutate(values, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        createForm.reset()
      },
    })
  }

  const handleUpdateUser = (values: z.infer<typeof updateUserSchema>) => {
    if (!selectedUser) return
    updateUser.mutate(
      { userId: selectedUser.id, data: values },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          updateForm.reset()
        },
      },
    )
  }

  const handleAssignRole = (role: string) => {
    if (!selectedUser) return
    assignRole.mutate(
      { userId: selectedUser.id, data: { role } },
      {
        onSuccess: () => {
          setRoleDialogOpen(false)
        },
      },
    )
  }

  const handleResetPassword = (values: z.infer<typeof resetPasswordSchema>) => {
    if (!selectedUser) return
    resetPassword.mutate(
      { userId: selectedUser.id, data: values },
      {
        onSuccess: () => {
          setPasswordDialogOpen(false)
          passwordForm.reset()
        },
      },
    )
  }

  const handleRevokeSessions = (userId: string) => {
    revokeSessionsMutation.mutate(userId)
  }

  const handleBanUser = (values: z.infer<typeof banUserSchema>) => {
    if (!selectedUser) return
    banUserMutation.mutate(
      { userId: selectedUser.id, data: values },
      {
        onSuccess: () => {
          setBanDialogOpen(false)
          banForm.reset()
        },
      },
    )
  }

  const handleUnbanUser = (userId: string) => {
    unbanUser.mutate(userId)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUser.mutate(userId)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditDialog = (user: any) => {
    setSelectedUser(user)
    updateForm.setValue("name", user.name)
    updateForm.setValue("email", user.email)
    setEditDialogOpen(true)
  }

  const openRoleDialog = (user: unknown) => {
    setSelectedUser(user)
    setRoleDialogOpen(true)
  }

  const openPasswordDialog = (user: unknown) => {
    setSelectedUser(user)
    setPasswordDialogOpen(true)
  }

  const openBanDialog = (user: unknown) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  return (
    <PermissionGuard resource="user" action="list">
      <div className="flex flex-col gap-6 p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {tr.users.title}
            </h1>
            <p className="text-muted-foreground mt-2">
              {tr.users.subtitle}
            </p>
          </div>

          <PermissionGuard resource="user" action="create" fallback={<div />}>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {tr.users.createUser}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{tr.users.createDialogTitle}</DialogTitle>
                  <DialogDescription>{tr.users.createDialogDesc}</DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr.users.fullName}</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr.users.email}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr.users.tempPassword}</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>{tr.users.tempPasswordDesc}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tr.users.role}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={tr.users.selectRole} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rolesData?.roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending ? tr.users.creating : tr.users.createBtn}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tr.users.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>{tr.users.systemUsers}</CardTitle>
            <CardDescription>{tr.users.totalUsers.replace("{count}", String(filteredUsers.length))}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.users.name}</TableHead>
                    <TableHead>{tr.users.email}</TableHead>
                    <TableHead>{tr.users.role}</TableHead>
                    <TableHead>{tr.common.status}</TableHead>
                    <TableHead className="text-right">{tr.users.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                              {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getRoleBadgeColor(user.role || "")} text-white border-none`}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleDisplayName(user.role || "")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            {tr.users.banned}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">
                            {tr.status.active}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-white/10">
                            <DropdownMenuLabel>{tr.users.actions}</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <PermissionGuard resource="user" action="create" fallback={<div />}>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {tr.common.edit}
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard resource="role" action="assign" fallback={<div />}>
                              <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                {tr.users.assignRole}
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard resource="user" action="set-password" fallback={<div />}>
                              <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                {tr.users.resetPassword}
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard resource="session" action="revoke" fallback={<div />}>
                              <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {tr.users.revokeSessions}
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <PermissionGuard resource="user" action="ban" fallback={<div />}>
                              {user.banned ? (
                                <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {tr.users.unbanUser}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => openBanDialog(user)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {tr.users.banUser}
                                </DropdownMenuItem>
                              )}
                            </PermissionGuard>
                            <PermissionGuard resource="user" action="delete" fallback={<div />}>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {tr.users.deleteUser}
                              </DropdownMenuItem>
                            </PermissionGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tr.users.editDialogTitle}</DialogTitle>
              <DialogDescription>{tr.users.editDialogDesc}</DialogDescription>
            </DialogHeader>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr.users.fullName}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr.users.email}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateUser.isPending}>
                    {updateUser.isPending ? tr.users.updating : tr.users.updateBtn}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Role Assignment Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tr.users.assignRole}</DialogTitle>
              <DialogDescription>{tr.users.assignRoleDesc.replace("{name}", selectedUser?.name ?? "")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {rolesData?.roles.map((role) => (
                <Button
                  key={role.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAssignRole(role.id)}
                  disabled={assignRole.isPending}
                >
                  <Badge
                    variant="outline"
                    className={`${getRoleBadgeColor(role.id)} text-white border-none`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {role.name}
                  </Badge>
                  <span className="text-muted-foreground text-sm">{role.description}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tr.users.resetPassword}</DialogTitle>
              <DialogDescription>{tr.users.resetPasswordDesc.replace("{name}", selectedUser?.name ?? "")}</DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr.users.newPassword}</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>{tr.users.newPasswordDesc}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{tr.users.sendEmail}</FormLabel>
                        <FormDescription>{tr.users.sendEmailDesc}</FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={resetPassword.isPending}>
                    {resetPassword.isPending ? tr.users.resetting : tr.users.resetPassword}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tr.users.banUser}</DialogTitle>
              <DialogDescription>{tr.users.banDialogDesc.replace("{name}", selectedUser?.name ?? "")}</DialogDescription>
            </DialogHeader>
            <Form {...banForm}>
              <form onSubmit={banForm.handleSubmit(handleBanUser)} className="space-y-4">
                <FormField
                  control={banForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr.users.reason}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Violation of terms" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" variant="destructive" disabled={banUserMutation.isPending}>
                    {banUserMutation.isPending ? tr.users.banning : tr.users.banUser}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}

