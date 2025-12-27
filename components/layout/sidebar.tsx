"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Users,
  Home,
  Settings,
  LogOut,
  Heart,
  Briefcase,
  FileText,
  BarChart3,
  Bell,
  Shield,
  UserCog,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { checkPermission } = usePermissions()
  const [canAccessSystemAdmin, setCanAccessSystemAdmin] = useState(false)

  // Check if user has permission to access system admin (requires user:list permission)
  useEffect(() => {
    checkPermission({ user: ["list"] }).then(setCanAccessSystemAdmin)
  }, [checkPermission])

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, section: "Main" },
    { name: "Members", href: "/members", icon: Users, section: "Main" },
    { name: "Family Relationships", href: "/families", icon: Heart, section: "Relationships" },
    { name: "Ministers & Leadership", href: "/ministers", icon: Shield, section: "Leadership" },
    { name: "Services & Ministries", href: "/church-services", icon: Briefcase, section: "Ministry" },
    { name: "Administrative Files", href: "/files", icon: FileText, section: "Admin" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, section: "Reports" },
    { name: "Notifications", href: "/notifications", icon: Bell, section: "Communication" },
    // Conditionally add System Admin link based on permissions
    ...(canAccessSystemAdmin
      ? [{ name: "System Administration", href: "/system-admin/users", icon: UserCog, section: "System" }]
      : []),
    { name: "Settings", href: "/settings", icon: Settings, section: "System" },
  ]

  const sections = Array.from(new Set(navigation.map((item) => item.section)))

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6 gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <Image src="/logo.png" alt="BYB Logo" width={32} height={32} />
        </div>
        <h1 className="font-bold text-lg">BYB Database</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="mb-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section}</p>
            {navigation
              .filter((item) => item.section === section)
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={async () => {
            await logout()
            // Navigation will be handled by dashboard layout when user becomes null
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
