"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import {
  useSystemConfig,
  useUpdateEnrollmentRules,
} from "@/lib/api/hooks/use-system-config"
import { OptionListEditor } from "@/components/settings/option-list-editor"
import { AgeGroupEditor } from "@/components/settings/age-group-editor"

export default function SettingsPage() {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.settings

  const { data: config, isLoading, isError } = useSystemConfig()
  const updateRules = useUpdateEnrollmentRules()

  const [maxServices, setMaxServices] = useState(2)
  const [allowExceptions, setAllowExceptions] = useState(true)

  useEffect(() => {
    if (config?.serviceEnrollmentRules) {
      setMaxServices(config.serviceEnrollmentRules.maxServicesPerMember)
      setAllowExceptions(config.serviceEnrollmentRules.allowExceptions)
    }
  }, [config])

  async function saveRules() {
    try {
      await updateRules.mutateAsync({
        maxServicesPerMember: maxServices,
        allowExceptions,
      })
      toast({ title: t.saved })
    } catch (error: any) {
      toast({
        title: t.saveFailed,
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError || !config ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t.loadError}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="service-types" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="service-types">{t.serviceTypes}</TabsTrigger>
            <TabsTrigger value="minister-roles">{t.ministerRoles}</TabsTrigger>
            <TabsTrigger value="education-levels">{t.educationLevels}</TabsTrigger>
            <TabsTrigger value="job-types">{t.jobTypes}</TabsTrigger>
            <TabsTrigger value="marital-status">{t.maritalStatuses}</TabsTrigger>
            <TabsTrigger value="age-groups">{t.ageGroups}</TabsTrigger>
            <TabsTrigger value="enrollment">{t.enrollmentRules}</TabsTrigger>
          </TabsList>

          <TabsContent value="service-types">
            <OptionListEditor
              resource="service-types"
              title={t.serviceTypes}
              items={config.serviceTypes || []}
            />
          </TabsContent>

          <TabsContent value="minister-roles">
            <OptionListEditor
              resource="minister-roles"
              title={t.ministerRoles}
              items={config.ministerRoles || []}
            />
          </TabsContent>

          <TabsContent value="education-levels">
            <OptionListEditor
              resource="education-levels"
              title={t.educationLevels}
              items={config.educationLevels || []}
            />
          </TabsContent>

          <TabsContent value="job-types">
            <OptionListEditor
              resource="job-types"
              title={t.jobTypes}
              items={config.jobTypes || []}
            />
          </TabsContent>

          <TabsContent value="marital-status">
            <OptionListEditor
              resource="marital-status"
              title={t.maritalStatuses}
              items={config.maritalStatusOptions || []}
            />
          </TabsContent>

          <TabsContent value="age-groups">
            <AgeGroupEditor items={config.ageGroups || []} />
          </TabsContent>

          <TabsContent value="enrollment">
            <Card>
              <CardHeader>
                <CardTitle>{t.enrollmentRules}</CardTitle>
                <CardDescription>{t.maxServicesDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="max-services">{t.maxServicesPerMember}</Label>
                  <Input
                    id="max-services"
                    type="number"
                    min={1}
                    max={10}
                    value={maxServices}
                    onChange={(e) => setMaxServices(parseInt(e.target.value) || 1)}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-exceptions">{t.allowExceptions}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t.allowExceptionsDesc}
                    </p>
                  </div>
                  <Switch
                    id="allow-exceptions"
                    checked={allowExceptions}
                    onCheckedChange={setAllowExceptions}
                  />
                </div>
                <Button onClick={saveRules} disabled={updateRules.isPending}>
                  {updateRules.isPending ? tr.common.saving : t.saveRules}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
