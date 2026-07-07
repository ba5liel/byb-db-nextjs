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
  FileSpreadsheet,
  BarChart3,
  Bell,
  Shield,
  UserCog,
  Lock,
  Network,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { checkPermission } = usePermissions()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const [canAccessSystemAdmin, setCanAccessSystemAdmin] = useState(false)

  useEffect(() => {
    checkPermission({ user: ["list"] }).then(setCanAccessSystemAdmin)
  }, [checkPermission])

  const navigation = [
    { name: tr.navigation.dashboard, href: "/", icon: Home, section: "Main" },
    { name: tr.navigation.members, href: "/members", icon: Users, section: "Main" },
    { name: tr.navigation.subCommunities, href: "/sub-communities", icon: Network, section: "Main" },
    { name: tr.navigation.familyRelationships, href: "/families", icon: Heart, section: "Relationships" },
    { name: tr.navigation.ministers, href: "/ministers", icon: Shield, section: "Leadership" },
    { name: tr.navigation.servicesMinistries, href: "/church-services", icon: Briefcase, section: "Ministry" },
    { name: tr.navigation.files, href: "/files", icon: FileText, section: "Admin", disabled: true },
    { name: tr.navigation.importExport, href: "/import-export", icon: FileSpreadsheet, section: "Admin" },
    { name: tr.navigation.reports, href: "/reports", icon: BarChart3, section: "Reports" },
    { name: tr.navigation.notifications, href: "/notifications", icon: Bell, section: "Communication", disabled: true },
    { name: tr.navigation.userManagement, href: "/users", icon: UserCog, section: "System" },
    { name: tr.navigation.roleManagement, href: "/roles", icon: Lock, section: "System" },
    ...(canAccessSystemAdmin
      ? [{ name: tr.navigation.systemAdmin, href: "/system-admin/users", icon: UserCog, section: "System" }]
      : []),
    { name: tr.navigation.settings, href: "/settings", icon: Settings, section: "System" },
  ]

  const sections = Array.from(new Set(navigation.map((item) => item.section))) as Array<keyof typeof tr.navigation.sections>

  return (
    <div className="flex h-screen w-64 flex-col border-r border-white/10 bg-sidebar/95 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-white/10 px-6 gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <Image src="/logo.png" alt="BYB Logo" width={32} height={32} />
        </div>
        <h1 className="font-bold text-xl">BYB Database</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="mb-6">
            <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {tr.navigation.sections[section]}
            </p>
            {navigation
              .filter((item) => item.section === section)
              .map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold opacity-40 cursor-not-allowed select-none"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-smooth ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-flat-lg"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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

      <div className="border-t border-white/10 p-4 glass-card">
        <div className="mb-3 px-3">
          <p className="text-sm font-bold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start font-semibold" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          {tr.navigation.logout}
        </Button>
      </div>
    </div>
  )
}
