"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Users,
  Home,
  Settings,
  LogOut,
  Briefcase,
  BarChart3,
  Shield,
  ChevronDown,
  Network,
  LayoutGrid,
  UserMinus,
  ClipboardList,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import {
  isScopedCommunityAdmin,
  isAgeScopedAdmin,
  ageGroupForRole,
  subCommunityForRole,
  isChildrenAdmin,
} from "@/lib/role-utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface NavChild {
  name: string
  href: string
  isActive?: (pathname: string) => boolean
  children?: NavChild[]
}

interface NavItem {
  id: string
  name: string
  href?: string
  icon: typeof Home
  children?: NavChild[]
  /** Collapsible with no children yet (e.g. Cellgroups). */
  emptyHint?: string
}

function isMembersListPath(pathname: string) {
  return (
    pathname === "/members" ||
    (/^\/members\/[^/]+/.test(pathname) &&
      !pathname.startsWith("/members/analytics") &&
      !pathname.startsWith("/members/import") &&
      !pathname.startsWith("/members/new") &&
      !pathname.startsWith("/members/community") &&
      !pathname.startsWith("/members/age") &&
      !pathname.startsWith("/members/left"))
  )
}

export function Sidebar() {
  const pathname = usePathname() || ""
  const { logout, user } = useAuth()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { checkPermission } = usePermissions()
  const [canAccessSystemAdmin, setCanAccessSystemAdmin] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkPermission({ user: ["list"] }).then(setCanAccessSystemAdmin)
  }, [checkPermission])

  const navigation: NavItem[] = useMemo(() => {
    const n = t.navigation
    const role = user?.role
    const scopedCommunity = subCommunityForRole(role)
    const isScoped = isScopedCommunityAdmin(role)
    const isAgeScoped = isAgeScopedAdmin(role)
    const scopedAge = ageGroupForRole(role)

    const memberChildren: NavChild[] = []
    if (isScoped && scopedCommunity) {
      const communityLabels: Record<string, string> = {
        jemmo: n.jemmo,
        bethel: n.bethel,
        weyira: n.weyira,
        alpha: n.alpha,
      }
      memberChildren.push({
        name: communityLabels[scopedCommunity] || scopedCommunity,
        href: `/members/community/${scopedCommunity}`,
        isActive: (p) => p.startsWith(`/members/community/${scopedCommunity}`),
      })
    } else if (isAgeScoped) {
      memberChildren.push({
        name:
          scopedAge === "Children"
            ? t.members.children
            : scopedAge === "Youth"
              ? t.members.youth
              : n.allMembers,
        href:
          scopedAge === "Children"
            ? "/members/age/children"
            : scopedAge === "Youth"
              ? "/members/age/youth"
              : "/members",
        isActive: (p) =>
          scopedAge === "Children"
            ? p.startsWith("/members/age/children")
            : scopedAge === "Youth"
              ? p.startsWith("/members/age/youth")
              : isMembersListPath(p),
      })
    } else {
      memberChildren.push(
        {
          name: n.allMembers,
          href: "/members",
          isActive: isMembersListPath,
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
          name: t.members.youth,
          href: "/members/age/youth",
          isActive: (p) => p.startsWith("/members/age/youth"),
        },
        {
          name: t.members.children,
          href: "/members/age/children",
          isActive: (p) => p.startsWith("/members/age/children"),
        },
        {
          name: n.importExcel,
          href: "/members/import",
          isActive: (p) => p.startsWith("/members/import"),
        },
      )
    }

    const items: NavItem[] = [
      { id: "dashboard", name: n.dashboard, href: "/", icon: Home },
      {
        id: "members",
        name: n.members,
        icon: Users,
        children: memberChildren,
      },
      {
        id: "left-members",
        name: n.leftMembers,
        href: "/members/left",
        icon: UserMinus,
      },
      {
        id: "tasks",
        name: n.tasks,
        href: "/tasks",
        icon: ClipboardList,
      },
      {
        id: "cellgroups",
        name: locale === "am" ? "ሴል ግሩፖች" : "Cell Groups",
        href: "/cell-groups",
        icon: Network,
      },
      {
        id: "families",
        name: n.families,
        href: "/families",
        icon: LayoutGrid,
      },
    ]

    // Children admins don't manage cell groups
    if (isChildrenAdmin(role)) {
      const idx = items.findIndex((item) => item.id === "cellgroups")
      if (idx >= 0) items.splice(idx, 1)
    }

    if (isScoped || isAgeScoped) {
      items.push({
        id: "reports",
        name: n.reports,
        icon: BarChart3,
        children: [
          {
            name: n.analytics,
            href: "/analytics",
            isActive: (p) => p === "/analytics" || p.startsWith("/analytics/"),
          },
          {
            name: n.generateReport,
            href: "/reports/generate",
            isActive: (p) => p.startsWith("/reports/generate"),
          },
        ],
      })
      items.push({
        id: "system",
        name: n.system,
        icon: Settings,
        children: [
          {
            name: n.settings,
            href: "/settings",
            isActive: (p) => p.startsWith("/settings"),
          },
        ],
      })
      return items
    }

    items.push({
      id: "ministries",
      name: locale === "am" ? "አገልግሎቶች" : "Ministries",
      href: "/church-services",
      icon: Briefcase,
    })

    items.push({
      id: "reports",
      name: n.reports,
      icon: BarChart3,
      children: [
        {
          name: n.analytics,
          href: "/analytics",
          isActive: (p) => p === "/analytics" || p.startsWith("/analytics/"),
        },
        {
          name: n.memberAnalytics,
          href: "/members/analytics",
          isActive: (p) => p.startsWith("/members/analytics"),
        },
        {
          name: n.generateReport,
          href: "/reports/generate",
          isActive: (p) => p.startsWith("/reports/generate"),
        },
      ],
    })

    const systemChildren: NavChild[] = [
      {
        name: n.userManagement,
        href: "/users",
        isActive: (p) => p === "/users" || p.startsWith("/users/"),
      },
      {
        name: n.roleManagement,
        href: "/roles",
        isActive: (p) => p.startsWith("/roles"),
      },
    ]

    if (canAccessSystemAdmin) {
      systemChildren.push(
        {
          name: n.systemAdmin,
          href: "/system-admin/users",
          isActive: (p) =>
            p.startsWith("/system-admin/users") || p === "/system-admin",
        },
        {
          name: n.seferManagement,
          href: "/system-admin/sefers",
          isActive: (p) => p.startsWith("/system-admin/sefers"),
        },
      )
    }

    systemChildren.push({
      name: n.settings,
      href: "/settings",
      isActive: (p) => p.startsWith("/settings"),
    })

    items.push({
      id: "system",
      name: n.system,
      icon: Shield,
      children: systemChildren,
    })

    return items
  }, [t.navigation, t.members, canAccessSystemAdmin, user?.role, locale])

  // Auto-open sections that contain the active route.
  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev }
      for (const item of navigation) {
        if (!item.children) continue
        const childActive = item.children.some((child) =>
          child.isActive ? child.isActive(pathname) : isLinkActive(pathname, child.href),
        )
        if (childActive) next[item.id] = true
      }
      return next
    })
  }, [pathname, navigation])

  function isLinkActive(path: string, href: string) {
    if (href === "/") return path === "/"
    return path === href || path.startsWith(`${href}/`)
  }

  function isItemActive(item: NavItem) {
    if (item.href) return isLinkActive(pathname, item.href)
    return item.children?.some((child) =>
      child.isActive ? child.isActive(pathname) : isLinkActive(pathname, child.href),
    )
  }

  function setSectionOpen(id: string, open: boolean) {
    setOpenSections((prev) => ({ ...prev, [id]: open }))
  }

  const linkBase =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
  const linkIdle = "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
  const linkActive = "bg-sidebar-accent text-foreground"
  const childLink =
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
  const childIdle = "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground"
  const childActive = "bg-sidebar-accent text-foreground"

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-background/50">
          <Image src="/logo.png" alt="BYB Logo" width={32} height={32} />
        </div>
        <h1 className="text-base font-bold leading-tight">
          {locale === "am" ? "የቤቴል ዳታቤዝ" : "BYB Database"}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children !== undefined
          const active = Boolean(isItemActive(item))

          if (!hasChildren && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(linkBase, active ? linkActive : linkIdle)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          }

          const open = openSections[item.id] ?? false

          return (
            <Collapsible
              key={item.id}
              open={open}
              onOpenChange={(value) => setSectionOpen(item.id, value)}
            >
              <CollapsibleTrigger
                className={cn(
                  linkBase,
                  "w-full justify-between",
                  active || open ? linkActive : linkIdle,
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 opacity-60 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                  {item.children && item.children.length > 0 ? (
                    item.children.map((child) => {
                      const childIsActive = child.isActive
                        ? child.isActive(pathname)
                        : isLinkActive(pathname, child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            childLink,
                            childIsActive ? childActive : childIdle,
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      {item.emptyHint}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="h-10 w-full justify-start rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t.navigation.logout}
        </Button>
      </div>
    </div>
  )
}
