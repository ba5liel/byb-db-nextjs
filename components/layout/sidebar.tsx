"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Users,
  Home,
  Settings,
  LogOut,
  Briefcase,
  FileText,
  BarChart3,
  Bell,
  Shield,
  UserCog,
  Lock,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface NavChild {
  name: string
  href: string
  /** Custom active predicate; defaults to exact or prefix match on href. */
  isActive?: (pathname: string) => boolean
}

interface NavItem {
  name: string
  href?: string
  icon: typeof Home
  section: string
  children?: NavChild[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { checkPermission } = usePermissions()
  const [canAccessSystemAdmin, setCanAccessSystemAdmin] = useState(false)

  useEffect(() => {
    checkPermission({ user: ["list"] }).then(setCanAccessSystemAdmin)
  }, [checkPermission])

  const navigation: NavItem[] = useMemo(() => {
    const n = t.navigation
    return [
      { name: n.dashboard, href: "/", icon: Home, section: n.main },
      {
        name: n.members,
        icon: Users,
        section: n.main,
        children: [
          {
            name: n.allMembers,
            href: "/members",
            isActive: (p) =>
              p === "/members" ||
              (/^\/members\/[^/]+/.test(p) &&
                !p.startsWith("/members/analytics") &&
                !p.startsWith("/members/import") &&
                !p.startsWith("/members/new") &&
                !p.startsWith("/members/community")),
          },
          {
            name: n.jemmo,
            href: "/members/community/jemmo",
            isActive: (p) => p.startsWith("/members/community/jemmo"),
          },
          {
            name: n.bethel,
            href: "/members/community/bethel",
            isActive: (p) => p.startsWith("/members/community/bethel"),
          },
          {
            name: n.weyira,
            href: "/members/community/weyira",
            isActive: (p) => p.startsWith("/members/community/weyira"),
          },
          {
            name: n.alpha,
            href: "/members/community/alpha",
            isActive: (p) => p.startsWith("/members/community/alpha"),
          },
          {
            name: n.importExcel,
            href: "/members/import",
            isActive: (p) => p.startsWith("/members/import"),
          },
          {
            name: n.memberAnalytics,
            href: "/members/analytics",
            isActive: (p) => p.startsWith("/members/analytics"),
          },
          {
            name: n.families,
            href: "/families",
            isActive: (p) => p.startsWith("/families"),
          },
        ],
      },
      { name: n.ministers, href: "/ministers", icon: Shield, section: n.leadership },
      { name: n.churchServices, href: "/church-services", icon: Briefcase, section: n.ministry },
      { name: n.files, href: "/files", icon: FileText, section: n.admin },
      { name: n.analytics, href: "/analytics", icon: BarChart3, section: n.reports },
      { name: n.notifications, href: "/notifications", icon: Bell, section: n.communication },
      { name: n.userManagement, href: "/users", icon: UserCog, section: n.system },
      { name: n.roleManagement, href: "/roles", icon: Lock, section: n.system },
      ...(canAccessSystemAdmin
        ? [
            {
              name: n.systemAdmin,
              href: "/system-admin/users",
              icon: UserCog,
              section: n.system,
            },
            {
              name: n.seferManagement,
              href: "/system-admin/sefers",
              icon: Home,
              section: n.system,
            },
          ]
        : []),
      { name: n.settings, href: "/settings", icon: Settings, section: n.system },
    ]
  }, [t.navigation, canAccessSystemAdmin])

  const sections = Array.from(new Set(navigation.map((item) => item.section)))

  const isLinkActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`)

  const itemBase =
    "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-base font-semibold transition-smooth"
  const itemIdle =
    "border-sidebar-border/80 bg-background/40 text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-foreground"
  const itemActive =
    "border-primary/30 bg-sidebar-accent text-foreground shadow-sm"
  const childBase =
    "flex items-center rounded-xl border px-3.5 py-3 text-[15px] font-semibold transition-smooth"
  const childIdle =
    "border-sidebar-border/80 bg-background/50 text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-foreground"
  const childActive =
    "border-primary/30 bg-sidebar-accent text-foreground shadow-sm"

  return (
    <div className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center border-b border-sidebar-border px-5 py-4 gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-sidebar-border bg-background/50">
          <Image src="/logo.png" alt="BYB Logo" width={36} height={36} />
        </div>
        <h1 className="font-bold text-xl leading-tight">
          {locale === "am" ? "የቤቴል ዳታቤዝ" : "BYB Database"}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="mb-5">
            <p className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              {section}
            </p>
            <div className="space-y-2">
              {navigation
                .filter((item) => item.section === section)
                .map((item) => {
                  if (item.children) {
                    return (
                      <div
                        key={item.name}
                        className="rounded-xl border border-sidebar-border/80 bg-background/35 p-2.5 space-y-2"
                      >
                        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-background/40 px-3.5 py-3 text-base font-semibold text-foreground">
                          <item.icon className="h-6 w-6 shrink-0" />
                          <span className="leading-snug">{item.name}</span>
                        </div>
                        <div className="space-y-2 pl-1">
                          {item.children.map((child) => {
                            const active = child.isActive
                              ? child.isActive(pathname || "")
                              : isLinkActive(child.href)
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`${childBase} ${active ? childActive : childIdle}`}
                              >
                                <span className="leading-snug">{child.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }

                  const isActive = isLinkActive(item.href!)
                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      className={`${itemBase} ${isActive ? itemActive : itemIdle}`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      <span className="leading-snug">{item.name}</span>
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-xl border border-sidebar-border/80 bg-background/40 px-4 py-3">
          <p className="text-base font-bold leading-snug">{user?.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5 break-all">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start h-12 rounded-xl border border-sidebar-border/80 bg-background/30 text-base font-semibold hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t.navigation.logout}
        </Button>
      </div>
    </div>
  )
}
