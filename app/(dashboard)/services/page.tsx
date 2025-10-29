"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { Briefcase } from "lucide-react"

export default function ServicesPage() {
  const { locale } = useLanguage()
  const { toast } = useToast()
  const t = getTranslation(locale)
  const [currentServices, setCurrentServices] = useState<string[]>([])
  const [desiredServices, setDesiredServices] = useState<string[]>([])
  const [mentorshipBy, setMentorshipBy] = useState<string>("")

  const serviceOptions = [
    { value: "Choir", label: t.services.choir },
    { value: "Youth Ministry", label: t.services.youthMinistry },
    { value: "Sunday School", label: t.services.sundaySchool },
    { value: "Media Team", label: t.services.mediaTeam },
    { value: "Ushering", label: t.services.ushering },
    { value: "Prayer Team", label: t.services.prayerTeam },
    { value: "Worship", label: t.services.worship },
    { value: "Teaching", label: t.services.teaching },
  ]

  const handleCurrentServiceChange = (value: string, checked: boolean) => {
    if (checked) {
      if (currentServices.length >= 2) {
        toast({
          title: t.servicesPage.maxServicesReachedTitle,
          description: t.servicesPage.maxServicesReached,
          variant: "destructive",
        })
        return
      }
      setCurrentServices([...currentServices, value])
    } else {
      setCurrentServices(currentServices.filter((item) => item !== value))
    }
  }

  const handleDesiredServiceChange = (value: string, checked: boolean) => {
    if (checked) {
      setDesiredServices([...desiredServices, value])
    } else {
      setDesiredServices(desiredServices.filter((item) => item !== value))
    }
  }

  const handleSave = () => {

  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            {t.servicesPage.title}
          </h1>
          <p className="text-muted-foreground">{t.servicesPage.subtitle}</p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>{t.servicesPage.cardTitle}</CardTitle>
            <CardDescription>{t.servicesPage.cardSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currently Serving At */}
            <div>
              <Label className="text-base font-semibold">{t.servicesPage.currentServices}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t.servicesPage.currentServicesNote}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`current-${service.value}`}
                      checked={currentServices.includes(service.value)}
                      onCheckedChange={(checked) =>
                        handleCurrentServiceChange(service.value, checked as boolean)
                      }
                      disabled={
                        !currentServices.includes(service.value) && currentServices.length >= 2
                      }
                    />
                    <Label
                      htmlFor={`current-${service.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
              {currentServices.length >= 2 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                  {t.servicesPage.maxServicesReached}
                </p>
              )}
            </div>

            <Separator />

            {/* Wanting to Serve At */}
            <div>
              <Label className="text-base font-semibold">{t.servicesPage.desiredServices}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t.servicesPage.desiredServicesNote}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`desired-${service.value}`}
                      checked={desiredServices.includes(service.value)}
                      onCheckedChange={(checked) =>
                        handleDesiredServiceChange(service.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`desired-${service.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Shepherding/Mentorship */}
            <div>
              <Label htmlFor="mentorshipBy" className="text-base font-semibold">
                {t.servicesPage.mentorshipBy}
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                {t.servicesPage.mentorshipByNote}
              </p>
              <Input
                id="mentorshipBy"
                name="mentorshipBy"
                value={mentorshipBy}
                onChange={(e) => setMentorshipBy(e.target.value)}
                className="mt-1"
                placeholder={t.servicesPage.mentorshipByPlaceholder}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} size="lg">
                {t.servicesPage.save}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

