"use client"

/**
 * Admin User Detail Page
 * 
 * Displays detailed information about an admin user.
 * Requires user:read permission.
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Lock, Unlock, Key } from "lucide-react"
import { useSystemAdmin } from "@/lib/system-admin-context"
import { usePermissions } from "@/lib/use-permissions"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const ROLE_LABELS: Record<string, string> = {
  superAdmin: "Super Admin",
  admin: "Admin",
  ministerAdmin: "Minister Admin",
  serviceManager: "Service Manager",
  reportViewer: "Report Viewer",
  dataEntry: "Data Entry",
  user: "User",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  locked: "destructive",
  pending_activation: "outline",
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const { getUser, loading, error, lockAccount, unlockAccount, resetPassword, forcePasswordChange } = useSystemAdmin()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)

  // Permission states
  const [canUpdate, setCanUpdate] = useState(false)
  const [canSetPassword, setCanSetPassword] = useState(false)
  const [canBan, setCanBan] = useState(false)

  // Dialog states
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      setCanUpdate(await checkPermission({ user: ["update"] }))
      setCanSetPassword(await checkPermission({ user: ["set-password"] }))
      setCanBan(await checkPermission({ user: ["ban"] }))
    }
    checkPermissions()
  }, [checkPermission])

  // Fetch user details
  useEffect(() => {
    if (userId) {
      getUser(userId).then(setUser)
    }
  }, [userId, getUser])

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  // Handle reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    try {
      await resetPassword(userId, {
        newPassword,
        forcePasswordChange: true,
        sendViaEmail: true,
      })
      toast({
        title: "Success",
        description: "Password reset successfully",
      })
      setResetPasswordDialogOpen(false)
      setNewPassword("")
      // Refresh user data
      getUser(userId).then(setUser)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reset password",
        variant: "destructive",
      })
    }
  }

  // Handle lock/unlock
  const handleLock = async () => {
    try {
      if (user.status === "locked") {
        await unlockAccount(userId)
        toast({
          title: "Success",
          description: "User account unlocked",
        })
      } else {
        await lockAccount(userId, {
          reason: "Manual lock by administrator",
        })
        toast({
          title: "Success",
          description: "User account locked",
        })
      }
      setLockDialogOpen(false)
      // Refresh user data
      getUser(userId).then(setUser)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update account status",
        variant: "destructive",
      })
    }
  }

  // Handle force password change
  const handleForcePasswordChange = async () => {
    try {
      await forcePasswordChange(userId)
      toast({
        title: "Success",
        description: "User will be required to change password on next login",
      })
      getUser(userId).then(setUser)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to force password change",
        variant: "destructive",
      })
    }
  }

  if (loading && !user) {
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

  if (error && !user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Link href="/system-admin/users" className="mt-4 inline-block">
              <Button variant="outline">Back to Users</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">User not found</p>
            <Link href="/system-admin/users" className="mt-4 inline-block">
              <Button variant="outline">Back to Users</Button>
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
        <Link href="/system-admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.fullName}</h1>
          <p className="text-muted-foreground mt-1">{user.username}</p>
        </div>
        {canUpdate && (
          <Link href={`/system-admin/users/${userId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* User Details */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              {user.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg">{user.phoneNumber}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="outline" className="mt-1">
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={STATUS_VARIANTS[user.status]} className="mt-1">
                  {user.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                <p>{formatDate(user.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Login IP</p>
                <p>{user.lastLoginIp || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Password Last Changed</p>
                <p>{formatDate(user.passwordLastChangedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Must Change Password</p>
                <Badge variant={user.mustChangePassword ? "destructive" : "default"}>
                  {user.mustChangePassword ? "Yes" : "No"}
                </Badge>
              </div>
              {user.lockedUntil && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Locked Until</p>
                  <p>{formatDate(user.lockedUntil)}</p>
                </div>
              )}
              {user.lockReason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lock Reason</p>
                  <p>{user.lockReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage user account and security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {canSetPassword && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setResetPasswordDialogOpen(true)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleForcePasswordChange}
                  >
                    Force Password Change
                  </Button>
                </>
              )}
              {canBan && (
                <Button
                  variant="outline"
                  onClick={() => setLockDialogOpen(true)}
                >
                  {user.status === "locked" ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unlock Account
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new temporary password for {user.fullName}. The user will be required to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock/Unlock Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.status === "locked" ? "Unlock Account" : "Lock Account"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {user.status === "locked" ? "unlock" : "lock"} {user.fullName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLock}>
              {user.status === "locked" ? "Unlock" : "Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

