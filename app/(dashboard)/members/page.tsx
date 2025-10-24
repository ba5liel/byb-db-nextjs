"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  X,
} from "lucide-react"
import { useMembers } from "@/lib/members-context"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function MembersPage() {
  const { members, deleteMember } = useMembers()
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

  function handleDeleteClick(id: string) {
    setMemberToDelete(id)
    setDeleteDialogOpen(true)
  }

  function handleDeleteConfirm() {
    if (memberToDelete) {
      deleteMember(memberToDelete)
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || member.membershipStatus === statusFilter
    const matchesGender = genderFilter === "all" || member.gender === genderFilter
    const matchesAgeGroup = ageGroupFilter === "all" || member.ageGroup === ageGroupFilter
    const matchesSubCommunity = subCommunityFilter === "all" || member.subCommunity === subCommunityFilter
    const matchesGroupType = groupTypeFilter === "all" || member.currentGroupType === groupTypeFilter
    const matchesMaritalStatus = maritalStatusFilter === "all" || member.maritalStatus === maritalStatusFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesGender &&
      matchesAgeGroup &&
      matchesSubCommunity &&
      matchesGroupType &&
      matchesMaritalStatus
    )
  })

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

  const activeFiltersCount = [
    statusFilter !== "all",
    genderFilter !== "all",
    ageGroupFilter !== "all",
    subCommunityFilter !== "all",
    groupTypeFilter !== "all",
    maritalStatusFilter !== "all",
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setStatusFilter("all")
    setGenderFilter("all")
    setAgeGroupFilter("all")
    setSubCommunityFilter("all")
    setGroupTypeFilter("all")
    setMaritalStatusFilter("all")
    setSearchTerm("")
    setCurrentPage(1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t.members.title}</h1>
            <p className="text-muted-foreground">{t.members.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.common.actions}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/members/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t.members.addMember}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">Total Members</CardDescription>
              <CardTitle className="text-3xl font-bold">{members.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">
                {t.members.activeMembers}
              </CardDescription>
              <CardTitle className="text-3xl font-bold">
                {members.filter((m) => m.membershipStatus === "Active").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">New This Month</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {
                  members.filter((m) => {
                    const joinDate = new Date(m.joinDate)
                    const now = new Date()
                    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
                  }).length
                }
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">Transfers</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {members.filter((m) => m.isTransfer).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t.members.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                  {t.common.filters}
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.common.clearAll}</span>
                  </Button>
                )}
              </div>

              {showFilters && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.basicInfo.membershipStatus}</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Active">{t.status.active}</SelectItem>
                          <SelectItem value="Inactive">{t.status.inactive}</SelectItem>
                          <SelectItem value="Removed">{t.status.removed}</SelectItem>
                          <SelectItem value="Transferred Out">{t.status.transferredOut}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.basicInfo.gender}</label>
                      <Select value={genderFilter} onValueChange={setGenderFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Male">{t.common.male}</SelectItem>
                          <SelectItem value="Female">{t.common.female}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Age Group</label>
                      <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Children">{t.ageGroup.children}</SelectItem>
                          <SelectItem value="Teenagers">{t.ageGroup.teenagers}</SelectItem>
                          <SelectItem value="Youth">{t.ageGroup.youth}</SelectItem>
                          <SelectItem value="Adults">{t.ageGroup.adults}</SelectItem>
                          <SelectItem value="Seniors">{t.ageGroup.seniors}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.churchGrouping.subCommunity}</label>
                      <Select value={subCommunityFilter} onValueChange={setSubCommunityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Jemmo">{t.subCommunity.jemmo}</SelectItem>
                          <SelectItem value="Bethel">{t.subCommunity.bethel}</SelectItem>
                          <SelectItem value="Weyira">{t.subCommunity.weyira}</SelectItem>
                          <SelectItem value="Alfa">{t.subCommunity.alfa}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.churchGrouping.currentGroupType}</label>
                      <Select value={groupTypeFilter} onValueChange={setGroupTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Cell Group">{t.groupType.cellGroup}</SelectItem>
                          <SelectItem value="Youth Group">{t.groupType.youthGroup}</SelectItem>
                          <SelectItem value="Bible Study">{t.groupType.bibleStudy}</SelectItem>
                          <SelectItem value="Prayer Group">{t.groupType.prayerGroup}</SelectItem>
                          <SelectItem value="None">{t.groupType.none}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">{t.basicInfo.maritalStatus}</label>
                      <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.common.all} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.common.all}</SelectItem>
                          <SelectItem value="Unmarried">{t.maritalStatus.unmarried}</SelectItem>
                          <SelectItem value="Married">{t.maritalStatus.married}</SelectItem>
                          <SelectItem value="Divorced">{t.maritalStatus.divorced}</SelectItem>
                          <SelectItem value="Widowed">{t.maritalStatus.widowed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>{t.members.allMembers}</CardTitle>
            <CardDescription>
              {t.members.memberCount
                .replace("{start}", String(startIndex + 1))
                .replace("{end}", String(Math.min(endIndex, filteredMembers.length)))
                .replace("{total}", String(filteredMembers.length))}
              {activeFiltersCount > 0 &&
                ` (${t.members.filterActive.replace("{count}", String(activeFiltersCount))})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{t.members.noMembers}</p>
                {(searchTerm || activeFiltersCount > 0) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    {t.common.clearAll}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">{t.basicInfo.fullName}</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground hidden md:table-cell">
                          {t.basicInfo.email}
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">{t.basicInfo.phone}</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">
                          {t.basicInfo.gender}
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">{t.common.status}</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">{t.common.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((member) => (
                        <tr key={member.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </div>
                            {member.membershipNumber && (
                              <div className="text-xs text-muted-foreground">ID: {member.membershipNumber}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                            {member.email || "-"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{member.phone}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                            {member.gender === "Male" ? t.common.male : member.gender === "Female" ? t.common.female : member.gender}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                member.membershipStatus === "Active"
                                  ? "default"
                                  : member.membershipStatus === "Inactive"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {member.membershipStatus === "Active"
                                ? t.status.active
                                : member.membershipStatus === "Inactive"
                                  ? t.status.inactive
                                  : member.membershipStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <Link href={`/members/${member.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/members/${member.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(member.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t.common.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t.common.next}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.members.deleteMember}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
