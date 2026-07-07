"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Heart } from "lucide-react"
import { useFamilies } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { FamilyTree } from "@/components/families/family-tree"

export default function FamilyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.families

  // The list payload already carries everything the tree needs;
  // pick the unit out of the cached families query.
  const { data: families, isLoading, isError } = useFamilies()
  const family = (families || []).find((f) => f.id === params.id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => router.push("/families")}>
        <ArrowLeft className="w-4 h-4" />
        {t.backToList}
      </Button>

      {isError || !family ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isError ? t.loadError : t.notFound}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {family.familyName} {t.familySuffix}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t.membersCount.replace("{count}", String(family.memberCount))}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="py-8 overflow-x-auto">
              <FamilyTree family={family} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
