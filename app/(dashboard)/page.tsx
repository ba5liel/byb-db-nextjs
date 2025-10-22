"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, LogOut, UserCheck, TrendingUp, Heart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useMembers } from "@/lib/members-context"

export default function Home() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const { members } = useMembers()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const totalMembers = members.length
  const activeMembers = members.filter((m) => m.membershipStatus === "Active").length
  const inactiveMembers = members.filter((m) => m.membershipStatus === "Inactive").length
  const suspendedMembers = members.filter((m) => m.membershipStatus === "Suspended").length

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = members.filter((m) => {
    const joinDate = new Date(m.joinDate)
    return joinDate >= firstDayOfMonth
  }).length

  const baptizedCount = members.filter((m) => m.baptismDate).length

  const maleCount = members.filter((m) => m.gender === "Male").length
  const femaleCount = members.filter((m) => m.gender === "Female").length
  const otherGenderCount = members.filter((m) => m.gender === "Other").length

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Church Member Management</h1>
              <p className="text-muted-foreground text-lg">Welcome, {user?.name}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/members/new">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add Member
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 bg-transparent" onClick={logout}>
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary">{totalMembers}</div>
                <Users className="w-12 h-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{activeMembers}</div>
                <UserCheck className="w-12 h-12 text-green-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{newThisMonth}</div>
                <TrendingUp className="w-12 h-12 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Baptized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">{baptizedCount}</div>
                <Heart className="w-12 h-12 text-purple-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Membership Status</CardTitle>
              <CardDescription>Distribution by membership status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <span className="text-2xl font-bold">{activeMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm font-medium">Inactive</span>
                  </div>
                  <span className="text-2xl font-bold">{inactiveMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <span className="text-sm font-medium">Suspended</span>
                  </div>
                  <span className="text-2xl font-bold">{suspendedMembers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Member demographics by gender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-sm font-medium">Male</span>
                  </div>
                  <span className="text-2xl font-bold">{maleCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-pink-600" />
                    <span className="text-sm font-medium">Female</span>
                  </div>
                  <span className="text-2xl font-bold">{femaleCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-600" />
                    <span className="text-sm font-medium">Other</span>
                  </div>
                  <span className="text-2xl font-bold">{otherGenderCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your church members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/members">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
                  <Users className="w-5 h-5" />
                  View All Members
                </Button>
              </Link>
              <Link href="/members/new">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
                  <Plus className="w-5 h-5" />
                  Add New Member
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
