/**
 * Role Management Component
 * 
 * Allows administrators to create and manage dynamic roles within the organization
 * Features:
 * - Create new roles with custom permissions
 * - Edit existing roles
 * - Delete roles
 * - Permission matrix interface
 */

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  createCustomRole,
  listOrgRoles,
  updateRole,
  deleteRole,
} from "@/lib/auth-operations"
import { RESOURCES, ACTIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2, Edit, Save, X } from "lucide-react"
import { toast } from "sonner"

/**
 * Available resources for permission assignment
 */
const AVAILABLE_RESOURCES = [
  { key: RESOURCES.MEMBER, label: "Members" },
  { key: RESOURCES.CHURCH_SERVICE, label: "Church Services" },
  { key: RESOURCES.MINISTER, label: "Ministers" },
  { key: RESOURCES.ANALYTICS, label: "Analytics" },
  { key: RESOURCES.ROLE, label: "Roles" },
  { key: RESOURCES.USER, label: "Users (System)" },
  { key: RESOURCES.SESSION, label: "Sessions (System)" },
]

/**
 * Available actions for permission assignment
 */
const AVAILABLE_ACTIONS = [
  { key: ACTIONS.CREATE, label: "Create" },
  { key: ACTIONS.READ, label: "Read" },
  { key: ACTIONS.UPDATE, label: "Update" },
  { key: ACTIONS.DELETE, label: "Delete" },
  { key: ACTIONS.LIST, label: "List" },
  { key: ACTIONS.APPROVE, label: "Approve" },
  { key: ACTIONS.SUSPEND, label: "Suspend" },
  { key: ACTIONS.ENROLL, label: "Enroll" },
  { key: ACTIONS.EXIT, label: "Exit" },
  { key: ACTIONS.MANAGE_ACCESS, label: "Manage Access" },
  { key: ACTIONS.VIEW_REPORTS, label: "View Reports" },
  { key: ACTIONS.VIEW_DASHBOARD, label: "View Dashboard" },
  { key: ACTIONS.EXPORT_DATA, label: "Export Data" },
  { key: ACTIONS.ASSIGN, label: "Assign" },
  { key: ACTIONS.BAN, label: "Ban" },
  { key: ACTIONS.IMPERSONATE, label: "Impersonate" },
  { key: ACTIONS.SET_PASSWORD, label: "Set Password" },
  { key: ACTIONS.SET_ROLE, label: "Set Role" },
  { key: ACTIONS.REVOKE, label: "Revoke" },
]

interface RoleFormProps {
  organizationId: string
  onSuccess?: () => void
  initialData?: {
    id?: string
    name: string
    description: string
    permissions: Record<string, string[]>
  }
  onCancel?: () => void
}

function RoleForm({ organizationId, onSuccess, initialData, onCancel }: RoleFormProps) {
  const [roleName, setRoleName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [permissions, setPermissions] = useState<Record<string, string[]>>(
    initialData?.permissions || {}
  )
  const [loading, setLoading] = useState(false)

  const togglePermission = (resource: string, action: string) => {
    setPermissions((prev) => {
      const current = prev[resource] || []
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]

      return {
        ...prev,
        [resource]: updated,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (initialData?.id) {
        // Update existing role
        const { error } = await updateRole(
          organizationId,
          initialData.id,
          permissions,
          description
        )

        if (error) {
          toast.error(`Failed to update role: ${error.message}`)
        } else {
          toast.success("Role updated successfully!")
          onSuccess?.()
        }
      } else {
        // Create new role
        const { error } = await createCustomRole(
          organizationId,
          roleName,
          permissions,
          description
        )

        if (error) {
          toast.error(`Failed to create role: ${error.message}`)
        } else {
          toast.success("Role created successfully!")
          // Reset form
          setRoleName("")
          setDescription("")
          setPermissions({})
          onSuccess?.()
        }
      }
    } catch (error) {
      toast.error(`Operation failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Role Name {!initialData && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            required={!initialData}
            disabled={!!initialData}
            placeholder="e.g., finance_manager"
            className="w-full"
          />
          {!initialData && (
            <p className="text-xs text-muted-foreground mt-1">
              Use lowercase with underscores. Cannot be changed after creation.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this role does..."
            rows={3}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Permissions</h3>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Resource</TableHead>
                {AVAILABLE_ACTIONS.map((action) => (
                  <TableHead key={action.key} className="text-center text-xs">
                    {action.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {AVAILABLE_RESOURCES.map((resource) => (
                <TableRow key={resource.key}>
                  <TableCell className="font-medium">{resource.label}</TableCell>
                  {AVAILABLE_ACTIONS.map((action) => (
                    <TableCell key={action.key} className="text-center">
                      <Checkbox
                        checked={
                          permissions[resource.key]?.includes(action.key) || false
                        }
                        onCheckedChange={() =>
                          togglePermission(resource.key, action.key)
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || (!initialData && !roleName)}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Update Role
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export function RoleManagement() {
  const { activeOrg } = useAuth()
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchRoles = async () => {
    if (!activeOrg) return

    setLoading(true)
    try {
      const { data, error } = await listOrgRoles(activeOrg.id)

      if (error) {
        toast.error("Failed to load roles")
      } else {
        setRoles(data || [])
      }
    } catch (error) {
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [activeOrg])

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!activeOrg) return

    if (
      !confirm(
        `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const { error } = await deleteRole(activeOrg.id, roleId)

      if (error) {
        toast.error(`Failed to delete role: ${error.message}`)
      } else {
        toast.success("Role deleted successfully")
        fetchRoles()
      }
    } catch (error) {
      toast.error("Failed to delete role")
    }
  }

  if (!activeOrg) {
    return (
      <Alert>
        <AlertDescription>
          Please select an organization to manage roles.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Create and manage custom roles with specific permissions for your
            organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm && !editingRole && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Role
            </Button>
          )}

          {(showCreateForm || editingRole) && (
            <RoleForm
              organizationId={activeOrg.id}
              initialData={editingRole}
              onSuccess={() => {
                setShowCreateForm(false)
                setEditingRole(null)
                fetchRoles()
              }}
              onCancel={() => {
                setShowCreateForm(false)
                setEditingRole(null)
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Roles</CardTitle>
          <CardDescription>
            Manage existing roles in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <Alert>
              <AlertDescription>
                No roles found. Create your first role to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id, role.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <strong>Permissions:</strong>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(role.permissions || {}).map(
                          ([resource, actions]: [string, any]) => (
                            <li key={resource} className="text-muted-foreground">
                              {resource}: {actions.join(", ")}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

