"use client"

import { Bell, Search, User, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { useCurrentUserRole } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getRoleDisplayNameAmharic, getRoleDisplayName, getRoleBadgeColor } from "@/lib/permissions"

export function Header() {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const { data: currentUserRole } = useCurrentUserRole()
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const userInitials = currentUserRole?.name
    ? currentUserRole.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 glass-card px-6 shadow-flat">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder={t.members.searchPlaceholder} 
            className="pl-10 h-10 border-white/10 bg-white/5 backdrop-blur-sm font-medium" 
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        
        <Button variant="ghost" size="icon" className="hover:bg-accent/50">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-accent/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUserRole?.userId || undefined} />
                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{currentUserRole?.name || "Loading..."}</span>
                {currentUserRole?.role && (
                  <Badge 
                    variant="outline" 
                    className={`${getRoleBadgeColor(currentUserRole.role)} text-white border-none text-[10px] px-1.5 py-0`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {locale === "am" 
                      ? getRoleDisplayNameAmharic(currentUserRole.role)
                      : getRoleDisplayName(currentUserRole.role)
                    }
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUserRole?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUserRole?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>{locale === "am" ? "መገለጫ" : "Profile"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>{locale === "am" ? "ቅንብሮች" : "Settings"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <span>{locale === "am" ? "ውጣ" : "Logout"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
