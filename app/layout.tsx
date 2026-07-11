import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { MembersProvider } from "@/lib/members-context"
import { ChurchServicesProvider } from "@/lib/church-services-context"
import { SystemAdminProvider } from "@/lib/system-admin-context"
import { LanguageProvider } from "@/lib/language-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/api/query-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Church Management System",
  description: "Manage church members and ministries",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <LanguageProvider>
              <AuthProvider>
                <MembersProvider>
                <SystemAdminProvider>
                <ChurchServicesProvider>
                  {children}
                  <Toaster />
                  </ChurchServicesProvider>
                  </SystemAdminProvider>
                </MembersProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
