"use client"

/**
 * Edit Admin User Page
 * 
 * Form to edit an existing admin user.
 * Requires user:update permission.
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save } from "lucide-react"
import { useSystemAdmin } from "@/lib/system-admin-context"
import { usePermissions } from "@/lib/use-permissions"
import { useToast } from "@/hooks/use-toast"
import type { UpdateAdminUserDto, AdminUserRole } from "@/lib/types"

const ROLES: { value: AdminUserRole; label: string }[] = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "ministerAdmin", label: "Minister Admin" },
  { value: "serviceManager", label: "Service Manager" },
  { value: "reportViewer", label: "Report Viewer" },
  { value: "dataEntry", label: "Data Entry" },
  { value: "user", label: "User" },
]

export default function EditAdminUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const { getUser, updateUser, loading, error } = useSystemAdmin()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const [hasPermission, setHasPermission] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Check permission on mount
  useEffect(() => {
    checkPermission({ user: ["update"] }).then(setHasPermission)
  }, [checkPermission])

  // Form state
  const [formData, setFormData] = useState<UpdateAdminUserDto>({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "admin",
  })

  // Fetch user data
  useEffect(() => {
    if (userId) {
      getUser(userId).then((userData) => {
        if (userData) {
          setUser(userData)
          setFormData({
            fullName: userData.fullName || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            role: userData.role || "admin",
            notifyOnPasswordChange: userData.notifyOnPasswordChange ?? true,
            notifyOnLogin: userData.notifyOnLogin ?? true,
          })
        }
      })
    }
  }, [userId, getUser])

  // Handle input changes
  const handleChange = (field: keyof UpdateAdminUserDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSubmitError(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    try {
      // Build update payload (only include changed fields)
      const updateData: UpdateAdminUserDto = {}
      if (formData.fullName) updateData.fullName = formData.fullName
      if (formData.email) updateData.email = formData.email
      if (formData.phoneNumber !== undefined)
        updateData.phoneNumber = formData.phoneNumber || undefined
      if (formData.role) updateData.role = formData.role
      if (formData.notifyOnPasswordChange !== undefined)
        updateData.notifyOnPasswordChange = formData.notifyOnPasswordChange
      if (formData.notifyOnLogin !== undefined)
        updateData.notifyOnLogin = formData.notifyOnLogin

      const updatedUser = await updateUser(userId, updateData)
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      router.push(`/system-admin/users/${updatedUser._id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update user")
    }
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">You do not have permission to update users.</p>
            <Link href="/system-admin/users" className="mt-4 inline-block">
              <Button variant="outline">Back to Users</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
        <Link href={`/system-admin/users/${userId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Admin User</h1>
          <p className="text-muted-foreground mt-1">{user.fullName}</p>
        </div>
      </div>

      {/* Error Messages */}
      {(error || submitError) && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{submitError || error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the admin user information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="e.g., Pastor John Doe"
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g., pastor.john@church.org"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="e.g., +251911234567"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnPasswordChange"
                  checked={formData.notifyOnPasswordChange ?? true}
                  onCheckedChange={(checked) => handleChange("notifyOnPasswordChange", checked)}
                />
                <Label htmlFor="notifyOnPasswordChange">Notify on password change</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnLogin"
                  checked={formData.notifyOnLogin ?? true}
                  onCheckedChange={(checked) => handleChange("notifyOnLogin", checked)}
                />
                <Label htmlFor="notifyOnLogin">Notify on login</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 mt-6">
          <Link href={`/system-admin/users/${userId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

