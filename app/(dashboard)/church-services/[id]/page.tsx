"use client"

/**
 * Church Service Detail Page
 *
 * Displays detailed information about a church service and allows
 * member enrollment/exit operations via inline dialogs.
 * Only accessible to superAdmin users.
 */

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Edit,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
  Phone,
  Check,
  User,
} from "lucide-react"
import { useChurchServices } from "@/lib/church-services-context"
import * as churchServicesAPI from "@/lib/church-services-api"
import type { EnrolledServiceMember } from "@/lib/church-services-api"
import { membersService } from "@/lib/api/services"
import type { MemberSearchResult } from "@/lib/api/types"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { ServiceType } from "@/lib/types"

export default function ChurchServiceDetailPage() {
  const params = useParams()
  const serviceId = params.id as string
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const { getService, loading, error } = useChurchServices()
  const [service, setService] = useState<any>(null)

  // Enrolled members list
  const [members, setMembers] = useState<EnrolledServiceMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Enroll dialog state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState("")
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null)
  const [roleInService, setRoleInService] = useState("")
  const [enrollNotes, setEnrollNotes] = useState("")
  const [enrolling, setEnrolling] = useState(false)

  // Exit dialog state
  const [exitTarget, setExitTarget] = useState<EnrolledServiceMember | null>(null)
  const [exitReason, setExitReason] = useState("")
  const [exiting, setExiting] = useState(false)

  // Fetch service details
  useEffect(() => {
    if (serviceId) {
      getService(serviceId).then(setService)
    }
  }, [serviceId, getService])

  // Fetch enrolled members
  const loadMembers = useCallback(async () => {
    if (!serviceId) return
    setMembersLoading(true)
    try {
      const data = await churchServicesAPI.getServiceMembers(serviceId)
      setMembers(data)
    } catch (err) {
      console.error("Error loading enrolled members:", err)
    } finally {
      setMembersLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  // Debounced member search for the enroll dialog
  useEffect(() => {
    if (!enrollOpen) return
    const q = memberQuery.trim()
    if (q.length === 0) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await membersService.searchMembers(q, 8)
        setSearchResults(res.data || [])
      } catch (err) {
        console.error("Member search failed:", err)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [memberQuery, enrollOpen])

  const resetEnrollForm = () => {
    setMemberQuery("")
    setSearchResults([])
    setSelectedMember(null)
    setRoleInService("")
    setEnrollNotes("")
  }

  const handleEnrollOpenChange = (open: boolean) => {
    setEnrollOpen(open)
    if (!open) resetEnrollForm()
  }

  const handleEnroll = async () => {
    if (!selectedMember) {
      toast({
        title: tr.churchServices.selectMemberFirst,
        variant: "destructive",
      })
      return
    }
    setEnrolling(true)
    try {
      await churchServicesAPI.enrollMemberToService(serviceId, {
        memberId: selectedMember._id,
        roleInService: roleInService.trim() || undefined,
        notes: enrollNotes.trim() || undefined,
      })
      toast({ title: tr.churchServices.enrollSuccess })
      handleEnrollOpenChange(false)
      await Promise.all([loadMembers(), getService(serviceId).then(setService)])
    } catch (err) {
      toast({
        title: tr.churchServices.enrollFailed,
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleExit = async () => {
    if (!exitTarget) return
    setExiting(true)
    try {
      await churchServicesAPI.exitMemberFromService(serviceId, {
        memberId: exitTarget.memberId,
        exitReason: exitReason.trim() || undefined,
      })
      toast({ title: tr.churchServices.exitSuccess })
      setExitTarget(null)
      setExitReason("")
      await Promise.all([loadMembers(), getService(serviceId).then(setService)])
    } catch (err) {
      toast({
        title: tr.churchServices.exitFailed,
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setExiting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading && !service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Link href="/church-services" className="mt-4 inline-block">
              <Button variant="outline">{tr.churchServices.backToServices}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{tr.churchServices.serviceNotFound}</p>
            <Link href="/church-services" className="mt-4 inline-block">
              <Button variant="outline">{tr.churchServices.backToServices}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const atCapacity =
    service.maximum_members_allowed != null &&
    (service.currentMemberCount ?? members.length) >= service.maximum_members_allowed

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/church-services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{service.serviceName}</h1>
          <p className="text-muted-foreground mt-1">
            {tr.churchServices.typeLabels[service.type as ServiceType] || service.type}
          </p>
        </div>
        <Link href={`/church-services/${serviceId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            {tr.common.edit}
          </Button>
        </Link>
      </div>

      {/* Service Details */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{tr.churchServices.serviceInformation}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{tr.common.status}:</span>
              <Badge variant={service.status ? "default" : "secondary"}>
                {service.status ? tr.status.active : tr.status.inactive}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <span className="text-sm font-medium">{tr.churchServices.description}:</span>
              <p className="text-muted-foreground mt-1">
                {service.serviceDescription}
              </p>
            </div>

            {/* Leader */}
            <div>
              <span className="text-sm font-medium">{tr.churchServices.leader}:</span>
              <p className="text-muted-foreground mt-1">
                {typeof service.leader === "object"
                  ? service.leader.fullName || service.leader._id
                  : service.leader}
              </p>
            </div>

            {/* Secretary */}
            {service.secretary && (
              <div>
                <span className="text-sm font-medium">{tr.churchServices.secretary}:</span>
                <p className="text-muted-foreground mt-1">
                  {typeof service.secretary === "object"
                    ? service.secretary.fullName || service.secretary._id
                    : service.secretary}
                </p>
              </div>
            )}

            {/* Leadership Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">{tr.churchServices.leadershipStart}:</span>
                <p className="text-muted-foreground mt-1">
                  {formatDate(service.leadership_start)}
                </p>
              </div>
              {service.leadership_end && (
                <div>
                  <span className="text-sm font-medium">{tr.churchServices.leadershipEnd}:</span>
                  <p className="text-muted-foreground mt-1">
                    {formatDate(service.leadership_end)}
                  </p>
                </div>
              )}
            </div>

            {/* Meeting Info */}
            {service.meeting_schedule && (
              <div>
                <span className="text-sm font-medium">{tr.churchServices.meetingSchedule}:</span>
                <p className="text-muted-foreground mt-1">
                  {service.meeting_schedule}
                </p>
              </div>
            )}

            {service.meeting_location && (
              <div>
                <span className="text-sm font-medium">{tr.churchServices.meetingLocation}:</span>
                <p className="text-muted-foreground mt-1">
                  {service.meeting_location}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>{tr.churchServices.memberStats}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{tr.churchServices.currentMembersLabel}</p>
                <p className="text-2xl font-bold">
                  {service.currentMemberCount ?? members.length}
                </p>
              </div>
              {service.maximum_members_allowed && (
                <div>
                  <p className="text-sm text-muted-foreground">{tr.churchServices.capacity}</p>
                  <p className="text-2xl font-bold">
                    {service.maximum_members_allowed}
                  </p>
                </div>
              )}
              {service.availableSlots !== null &&
                service.availableSlots !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">{tr.churchServices.available}</p>
                    <p className="text-2xl font-bold">
                      {service.availableSlots}
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Members */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>
                {tr.churchServices.enrolledMembers}
                {!membersLoading && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({members.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription>{tr.churchServices.enrolledMembersDesc}</CardDescription>
            </div>
            {service.status && (
              <Button
                onClick={() => setEnrollOpen(true)}
                disabled={atCapacity}
                title={atCapacity ? tr.churchServices.capacity : undefined}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {tr.churchServices.enrollMember}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {tr.churchServices.noMembersEnrolled}
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div
                    key={m.enrollmentId}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {m.fullName || m.memberId}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {m.membershipNumber && (
                          <span>{tr.churchServices.membershipNo}: {m.membershipNumber}</span>
                        )}
                        {m.phoneNumber && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {m.phoneNumber}
                          </span>
                        )}
                        {m.roleInService && (
                          <Badge variant="outline" className="font-normal">
                            {m.roleInService}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExitTarget(m)
                        setExitReason("")
                      }}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      {tr.churchServices.exitMember}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={handleEnrollOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tr.churchServices.enrollMember}</DialogTitle>
            <DialogDescription>{tr.churchServices.enrollMemberDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Member search */}
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{selectedMember.fullName}</p>
                  {selectedMember.membershipNumber && (
                    <p className="text-sm text-muted-foreground">
                      {tr.churchServices.membershipNo}: {selectedMember.membershipNumber}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMember(null)
                    setMemberQuery("")
                  }}
                >
                  {tr.common.cancel}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="member-search">{tr.churchServices.enrollMember}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="member-search"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder={tr.churchServices.searchMemberPlaceholder}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
                {memberQuery.trim().length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-lg border">
                    {searching ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tr.churchServices.searchingMembers}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {tr.churchServices.noSearchResults}
                      </p>
                    ) : (
                      searchResults.map((hit) => (
                        <button
                          key={hit._id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(hit)
                            setSearchResults([])
                          }}
                          className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{hit.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[hit.membershipNumber, hit.phoneNumber]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Role in service */}
            <div className="space-y-2">
              <Label htmlFor="role-in-service">{tr.churchServices.roleInService}</Label>
              <Input
                id="role-in-service"
                value={roleInService}
                onChange={(e) => setRoleInService(e.target.value)}
                placeholder={tr.churchServices.roleInServicePlaceholder}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="enroll-notes">{tr.churchServices.enrollNotes}</Label>
              <Textarea
                id="enroll-notes"
                value={enrollNotes}
                onChange={(e) => setEnrollNotes(e.target.value)}
                placeholder={tr.churchServices.enrollNotesPlaceholder}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleEnrollOpenChange(false)}>
              {tr.common.cancel}
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling || !selectedMember}>
              {enrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr.churchServices.enrolling}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {tr.churchServices.enrollMember}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog
        open={!!exitTarget}
        onOpenChange={(open) => {
          if (!open) {
            setExitTarget(null)
            setExitReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr.churchServices.exitMemberTitle}</DialogTitle>
            <DialogDescription>
              {tr.churchServices.exitMemberDescNamed.replace(
                "{name}",
                exitTarget?.fullName || exitTarget?.memberId || ""
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="exit-reason">{tr.churchServices.exitReason}</Label>
            <Textarea
              id="exit-reason"
              value={exitReason}
              onChange={(e) => setExitReason(e.target.value)}
              placeholder={tr.churchServices.exitReasonPlaceholder}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExitTarget(null)
                setExitReason("")
              }}
            >
              {tr.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleExit} disabled={exiting}>
              {exiting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr.churchServices.exiting}
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  {tr.churchServices.confirmExitBtn}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
