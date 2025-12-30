"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Plus, UserCheck, TrendingUp, Heart, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useDashboardStats } from "@/lib/api/hooks"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { data: dashboardData, isLoading, error } = useDashboardStats()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const overview = dashboardData?.data?.overview
  const demographics = dashboardData?.data?.demographics
  const community = dashboardData?.data?.community

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/members/new">
            <Button size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="glass" hover="lift">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-primary">{overview?.totalMembers || 0}</div>
                  <Users className="w-10 h-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-green-500">{overview?.activeMembers || 0}</div>
                  <UserCheck className="w-10 h-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">New This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-blue-500">{overview?.newMembersThisMonth || 0}</div>
                  <TrendingUp className="w-10 h-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Male / Female</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-purple-500">
                    {overview?.maleCount || 0} / {overview?.femaleCount || 0}
                  </div>
                  <Heart className="w-10 h-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            {[...Array(2)].map((_, i) => (
              <Card key={i} variant="glass">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Demographics</CardTitle>
                <CardDescription>Gender distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-semibold">Male</span>
                    </div>
                    <span className="text-2xl font-bold">{demographics?.sexDistribution.male || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                      <span className="text-sm font-semibold">Female</span>
                    </div>
                    <span className="text-2xl font-bold">{demographics?.sexDistribution.female || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Age Groups</CardTitle>
                <CardDescription>Member age distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demographics?.ageGroupStats.slice(0, 3).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-sm font-semibold capitalize">{stat.ageGroup}</span>
                      </div>
                      <span className="text-2xl font-bold">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing your church</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/members">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 font-semibold">
                <Users className="w-5 h-5" />
                View All Members
              </Button>
            </Link>
            <Link href="/members/new">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 font-semibold">
                <Plus className="w-5 h-5" />
                Add New Member
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
