"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, Search, User, Users } from "lucide-react"
import { useFamilies } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function FamiliesPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.families

  const { data: families, isLoading, isError } = useFamilies()
  const [search, setSearch] = useState("")

  const filtered = (families || []).filter((f) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      f.familyName.toLowerCase().includes(q) ||
      f.members.some((m) => m.fullName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t.loadError}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t.noFamilies}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((family) => {
            const parents =
              (family.counts.father || 0) +
              (family.counts.mother || 0) +
              (family.counts.spouse || 0)
            const children = family.counts.child || 0
            return (
              <Card
                key={family.id}
                hover="lift"
                className="cursor-pointer"
                onClick={() => router.push(`/families/${family.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="w-5 h-5 text-primary" />
                    {family.familyName} {t.familySuffix}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t.membersCount.replace("{count}", String(family.memberCount))}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {parents > 0 && (
                      <Badge variant="secondary">
                        {parents} {t.parents}
                      </Badge>
                    )}
                    {children > 0 && (
                      <Badge variant="outline">
                        {children} {t.children}
                      </Badge>
                    )}
                    {(family.counts.sibling || 0) > 0 && (
                      <Badge variant="outline">
                        {family.counts.sibling} {t.siblings}
                      </Badge>
                    )}
                  </div>

                  {/* Avatars */}
                  <div className="flex -space-x-2">
                    {family.members.slice(0, 6).map((m) => (
                      <div
                        key={m._id}
                        title={m.fullName}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 border-background flex items-center justify-center overflow-hidden bg-muted"
                        )}
                      >
                        {m.memberPicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.memberPicture}
                            alt={m.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User
                            className={cn(
                              "w-4 h-4",
                              m.sex === "male" ? "text-blue-500" : "text-pink-500"
                            )}
                          />
                        )}
                      </div>
                    ))}
                    {family.memberCount > 6 && (
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold">
                        +{family.memberCount - 6}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
