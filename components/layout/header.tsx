"use client"

import { User, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getRoleDisplayNameAmharic, getRoleDisplayName, getRoleBadgeColor } from "@/lib/permissions"

export function Header() {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { user: currentUser, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <header className="flex h-12 items-center justify-end gap-3 border-b border-border bg-background px-6">
      <LanguageSwitcher />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto gap-2 py-1.5 hover:bg-accent/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.image || undefined} />
              <AvatarFallback className="text-xs font-bold bg-secondary text-secondary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold leading-tight">
                {currentUser?.name || "Loading..."}
              </span>
              {currentUser?.role && (
                <Badge
                  variant="outline"
                  className={`${getRoleBadgeColor(currentUser.role)} border-none text-[10px] px-1.5 py-0`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {locale === "am"
                    ? getRoleDisplayNameAmharic(currentUser.role)
                    : getRoleDisplayName(currentUser.role)}
                </Badge>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>{t.navigation.profile}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Shield className="mr-2 h-4 w-4" />
            <span>{t.navigation.settings}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <span>{t.navigation.logout}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
