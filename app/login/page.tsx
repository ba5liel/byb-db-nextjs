"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || t.auth.loginFailed)
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md bg-card border border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold text-foreground">
            {t.auth.churchManagement}
          </CardTitle>
          <CardDescription className="text-base">{t.auth.signInTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">{t.auth.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11"
                placeholder={t.auth.emailPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">{t.auth.password}</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11"
                placeholder={t.auth.passwordPlaceholder}
              />
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full font-bold">
              {loading ? t.auth.signingIn : t.auth.signIn}
            </Button>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">{t.auth.noAccount} </span>
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                {t.auth.signUp}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
