"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  TrendingUp,
  X,
  AlertCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useMembers, useServices, useDeleteMember } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { toast } from "@/hooks/use-toast"
import type { MemberDto } from "@/lib/api/types"

export default function MembersPage() {
  const { locale } = useLanguage()
  const t = getTranslation(locale)

  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const itemsPerPage = 10

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all")
  const [subCommunityFilter, setSubCommunityFilter] = useState<string>("all")
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>("all")
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>("all")

  // API hooks
  const { data: membersData, isLoading, error } = useMembers({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    subCommunity: subCommunityFilter === "all" ? undefined : subCommunityFilter,
    sex: genderFilter === "all" ? undefined : genderFilter,
    maritalStatus: maritalStatusFilter === "all" ? undefined : maritalStatusFilter,
    memberStatus: statusFilter === "all" ? undefined : statusFilter,
    groupType: groupTypeFilter === "all" ? undefined : groupTypeFilter,
    ageGroup: ageGroupFilter === "all" ? undefined : ageGroupFilter,
  })

  const { data: servicesData } = useServices({ limit: 100 }) // Get all services for dropdown
  const deleteMutation = useDeleteMember()

  const members = membersData?.data || []
  const pagination = membersData?.pagination
  const services = servicesData?.data || []

  function handleDeleteClick(id: string) {
    setMemberToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
  async function handleDeleteConfirm() {
    if (memberToDelete) {
      try {
        await deleteMutation.mutateAsync(memberToDelete)
        toast({
          title: "Success",
          description: "Member deleted successfully",
        })
        setDeleteDialogOpen(false)
        setMemberToDelete(null)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete member",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">{t.members.active}</Badge>
      case "inactive":
        return <Badge variant="secondary">{t.members.inactive}</Badge>
      case "removed":
        return <Badge variant="destructive">{t.members.removed}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="glass" className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold">Failed to load members</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{t.members.title}</h1>
          <p className="text-muted-foreground text-lg">{t.members.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/members/new">
            <Button size="lg" className="gap-2 font-semibold">
              <Plus className="w-5 h-5" />
              {t.members.addMember}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
            {t.members.filters}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.members.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t.members.filters}
            </CardTitle>
            <CardDescription>{t.members.filtersDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter">{t.members.membershipStatus}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder={t.members.selectStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.members.active}</SelectItem>
                    <SelectItem value="inactive">{t.members.inactive}</SelectItem>
                    <SelectItem value="removed">{t.members.removed}</SelectItem>
                    <SelectItem value="transferred">{t.members.transferredOut}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender-filter">{t.members.gender}</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger id="gender-filter">
                    <SelectValue placeholder={t.members.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allGenders}</SelectItem>
                    <SelectItem value="male">{t.members.male}</SelectItem>
                    <SelectItem value="female">{t.members.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcommunity-filter">{t.members.subCommunity}</Label>
                <Select value={subCommunityFilter} onValueChange={setSubCommunityFilter}>
                  <SelectTrigger id="subcommunity-filter">
                    <SelectValue placeholder={t.members.selectSubCommunity} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allSubCommunities}</SelectItem>
                    <SelectItem value="jemmo">{t.members.jemmo}</SelectItem>
                    <SelectItem value="bethel">{t.members.bethel}</SelectItem>
                    <SelectItem value="weyira">{t.members.weyira}</SelectItem>
                    <SelectItem value="alfa">{t.members.alfa}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age-group-filter">{t.members.ageGroup}</Label>
                <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                  <SelectTrigger id="age-group-filter">
                    <SelectValue placeholder={t.members.selectAgeGroup} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allAgeGroups}</SelectItem>
                    <SelectItem value="children">{t.members.children}</SelectItem>
                    <SelectItem value="teenagers">{t.members.teenagers}</SelectItem>
                    <SelectItem value="youth">{t.members.youth}</SelectItem>
                    <SelectItem value="adults">{t.members.adults}</SelectItem>
                    <SelectItem value="seniors">{t.members.seniors}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="group-type-filter">{t.members.groupType}</Label>
                <Select value={groupTypeFilter} onValueChange={setGroupTypeFilter}>
                  <SelectTrigger id="group-type-filter">
                    <SelectValue placeholder={t.members.selectGroupType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allGroupTypes}</SelectItem>
                    <SelectItem value="cell_group">{t.members.cellGroup}</SelectItem>
                    <SelectItem value="youth_group">{t.members.youthGroup}</SelectItem>
                    <SelectItem value="bible_study">{t.members.bibleStudy}</SelectItem>
                    <SelectItem value="prayer_group">{t.members.prayerGroup}</SelectItem>
                    <SelectItem value="none">{t.members.noGroup}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="marital-status-filter">{t.members.maritalStatus}</Label>
                <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                  <SelectTrigger id="marital-status-filter">
                    <SelectValue placeholder={t.members.selectMaritalStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.members.allMaritalStatuses}</SelectItem>
                    <SelectItem value="unmarried">{t.members.unmarried}</SelectItem>
                    <SelectItem value="married">{t.members.married}</SelectItem>
                    <SelectItem value="divorced">{t.members.divorced}</SelectItem>
                    <SelectItem value="widowed">{t.members.widowed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setGenderFilter("all")
                  setAgeGroupFilter("all")
                  setSubCommunityFilter("all")
                  setGroupTypeFilter("all")
                  setMaritalStatusFilter("all")
                }}
              >
                <X className="w-4 h-4 mr-2" />
                {t.members.clearFilters}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="glass">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card variant="glass" hover="lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.members.totalMembers}</p>
                    <p className="text-3xl font-bold text-primary">{pagination?.total || 0}</p>
                  </div>
                  <Users className="w-12 h-12 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.members.activeMembers}</p>
                    <p className="text-3xl font-bold text-green-600">
                      {members.filter((m) => m.memberStatus === "active").length}
                    </p>
                  </div>
                  <UserCheck className="w-12 h-12 text-green-600/20" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Services</p>
                    <p className="text-3xl font-bold text-blue-600">{services.length}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-600/20" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" hover="lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Page</p>
                    <p className="text-3xl font-bold text-purple-600">{members.length}</p>
                  </div>
                  <Filter className="w-12 h-12 text-purple-600/20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Members Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t.members.membersList}</CardTitle>
          <CardDescription>
            {pagination && `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} members`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Link href="/members/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.fullName}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{member.phoneNumber}</span>
                        {member.email && <span>{member.email}</span>}
                        <span className="capitalize">{member.subCommunity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(member.memberStatus || "active")}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/members/${member._id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/members/${member._id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Member
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(member._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.members.deleteMember}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.members.deleteConfirmation}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.members.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : t.members.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}