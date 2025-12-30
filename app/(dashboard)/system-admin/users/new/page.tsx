"use client"

/**
 * Create Admin User Page
 * 
 * Form to create a new admin user.
 * Requires user:create permission.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import { useSystemAdmin } from "@/lib/system-admin-context"
import { usePermissions } from "@/lib/use-permissions"
import { useToast } from "@/hooks/use-toast"
import type { CreateAdminUserDto, AdminUserRole } from "@/lib/types"

const ROLES: { value: AdminUserRole; label: string }[] = [
  { value: "superAdmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "ministerAdmin", label: "Minister Admin" },
  { value: "serviceManager", label: "Service Manager" },
  { value: "reportViewer", label: "Report Viewer" },
  { value: "dataEntry", label: "Data Entry" },
  { value: "user", label: "User" },
]

export default function NewAdminUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createUser, loading, error } = useSystemAdmin()
  const { checkPermission } = usePermissions()
  const [hasPermission, setHasPermission] = useState(false)

  // Check permission on mount
  useEffect(() => {
    checkPermission({ user: ["create"] }).then(setHasPermission)
  }, [checkPermission])

  // Form state
  const [formData, setFormData] = useState<CreateAdminUserDto>({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "admin",
    sendCredentialsEmail: true,
    sendCredentialsSms: false,
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  // Handle input changes
  const handleChange = (field: keyof CreateAdminUserDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSubmitError(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    try {
      // Validate required fields
      if (!formData.username.trim() || !formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
        setSubmitError("All required fields must be filled")
        return
      }

      // Remove empty optional fields
      const userData = {
        ...formData,
        phoneNumber: formData.phoneNumber || undefined,
      }

      const newUser = await createUser(userData)
      toast({
        title: "Success",
        description: "User created successfully",
      })
      router.push(`/system-admin/users/${newUser._id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create user")
    }
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">You do not have permission to create users.</p>
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
        <div>
          <h1 className="text-3xl font-bold">New Admin User</h1>
          <p className="text-muted-foreground mt-1">Create a new system administrator</p>
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
            <CardDescription>Basic information about the admin user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="e.g., pastor.john"
                required
                minLength={3}
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                Only letters, numbers, dots, underscores, and hyphens
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="e.g., Pastor John Doe"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g., pastor.john@church.org"
                required
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Temporary Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                maxLength={128}
              />
              <p className="text-sm text-muted-foreground">
                User will be required to change password on first login
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
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

            {/* Send Credentials */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sendCredentialsEmail"
                  checked={formData.sendCredentialsEmail}
                  onCheckedChange={(checked) => handleChange("sendCredentialsEmail", checked)}
                />
                <Label htmlFor="sendCredentialsEmail">Send credentials via Email</Label>
              </div>
              {formData.phoneNumber && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendCredentialsSms"
                    checked={formData.sendCredentialsSms}
                    onCheckedChange={(checked) => handleChange("sendCredentialsSms", checked)}
                  />
                  <Label htmlFor="sendCredentialsSms">Send credentials via SMS</Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 mt-6">
          <Link href="/system-admin/users" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  )
}

