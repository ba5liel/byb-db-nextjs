"use client"

import { Shield, Users, Eye } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRoles, usePermissions } from "@/lib/api/hooks"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { getRoleBadgeColor } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function RolesPage() {
  const { data: rolesData, isLoading: rolesLoading } = useRoles()
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()

  const roles = rolesData?.roles || []
  console.log('rolesfrom page', roles)
  const resources = permissionsData?.resources || {}

  return (
    <PermissionGuard resource="role" action="read">
      <div className="flex flex-col gap-6 p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Role Management
            </h1>
            <p className="text-muted-foreground mt-2">
              የሚና አስተዳደር - View roles and their permissions
            </p>
          </div>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle>System Roles</CardTitle>
                <CardDescription>
                  {roles.length} roles configured in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                      <Card key={role.id} className="glass-card border-white/10 hover:border-white/20 transition-all">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={`${getRoleBadgeColor(role.id)} text-white border-none px-3 py-1`}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {role.name}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mt-4">{role.nameAmharic}</CardTitle>
                          <CardDescription className="text-sm">
                            {role.description}
                          </CardDescription>
                          <CardDescription className="text-xs text-muted-foreground/70">
                            {role.descriptionAmharic}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm font-semibold">Permissions:</div>
                            <Accordion type="single" collapsible className="w-full">
                              {Object.entries(role.permissions.statements).map(([resource, actions]) => (
                                <AccordionItem key={resource} value={resource} className="border-white/10">
                                  <AccordionTrigger className="text-sm hover:no-underline">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {resource}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        ({(actions as string[]).length})
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {(actions as string[]).map((action) => (
                                        <Badge
                                          key={action}
                                          variant="secondary"
                                          className="text-xs bg-white/5"
                                        >
                                          {action}
                                        </Badge>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle>Available Permissions</CardTitle>
                <CardDescription>
                  All available resources and their actions in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.entries(resources).map(([resource, actions]) => (
                      <Card key={resource} className="glass-card border-white/10">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            {resource.replace(/_/g, " ").toUpperCase()}
                          </CardTitle>
                          <CardDescription>
                            Available actions for this resource
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {(actions as readonly string[]).map((action) => (
                              <Badge
                                key={action}
                                variant="outline"
                                className="bg-white/5 border-primary/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Permissions Matrix */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>
              Overview of which roles have access to which resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 font-semibold">Resource</th>
                      {roles.map((role) => (
                        <th key={role.id} className="text-center p-4">
                          <Badge
                            variant="outline"
                            className={`${getRoleBadgeColor(role.id)} text-white border-none text-xs`}
                          >
                            {role.name}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(resources).map((resource) => (
                      <tr key={resource} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 font-medium">
                          <Badge variant="outline" className="bg-white/5">
                            {resource}
                          </Badge>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="text-center p-4">
                            {role.permissions.statements[resource] ? (
                              <div className="flex flex-col items-center gap-1">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">
                                  {(role.permissions.statements[resource] as string[]).length} actions
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Description Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Super Admin
              </CardTitle>
              <CardDescription>ሱፐር አድሚን</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Full system access with all permissions. Can create, modify, and delete roles. 
                Has complete control over users, members, services, and system configuration.
              </p>
              <p className="text-xs text-muted-foreground/70">
                ሙሉ የስርዓት መዳረሻ ያለው። ሚናዎችን መፍጠር፣ ማስተካከል እና መሰረዝ ይችላል።
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Church Pastor
              </CardTitle>
              <CardDescription>የቤተ ክርስቲያን ፓስተር</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Full access to all church management operations. Can manage members, ministers, services, 
                and view all analytics. Can assign roles but cannot modify role definitions.
              </p>
              <p className="text-xs text-muted-foreground/70">
                ሙሉ የቤተ ክርስቲያን አስተዳደር መዳረሻ። አባላትን፣ ሚኒስተሮችን እና አገልግሎቶችን ማስተዳደር ይችላል።
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Minister
              </CardTitle>
              <CardDescription>ሚኒስተር</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Can manage members, services, and view reports. Limited administrative capabilities 
                focused on day-to-day church operations and member management.
              </p>
              <p className="text-xs text-muted-foreground/70">
                አባላትን፣ አገልግሎቶችን ማስተዳደር እና ሪፖርት ማየት ይችላል።
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-500" />
                Viewer
              </CardTitle>
              <CardDescription>ተመልካች</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Read-only access to all data. Can view members, services, ministers, and analytics 
                but cannot make any modifications. Ideal for reporting and oversight roles.
              </p>
              <p className="text-xs text-muted-foreground/70">
                ሁሉንም መረጃ ለማየት ብቻ። ማንኛውንም ለውጥ ማድረግ አይችልም።
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}

