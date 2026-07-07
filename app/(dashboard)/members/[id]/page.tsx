"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Heart,
  Users,
  Briefcase,
  GraduationCap,
  DollarSign,
  Home,
  AlertCircle,
} from "lucide-react"
import { useMember } from "@/lib/api/hooks"
import { mapBackendMemberToMember } from "@/lib/member-mapper"
import { FamilyRelationships, emptyFamilyData } from "@/components/family-relationships"
import type { FamilyData } from "@/components/family-relationships"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const { locale } = useLanguage()
  const tr = getTranslation(locale)
  const t = tr.memberDetail

  if (memberId === "new") {
    router.push("/members/new")
    return null
  }

  const { data: rawData, isLoading, error } = useMember(memberId)
  const raw = rawData?.data
  const member = raw ? mapBackendMemberToMember(raw) : null

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    )
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-12">
          <Link href="/members">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t.backToMembers}
            </Button>
          </Link>
          <div className="text-center text-muted-foreground">
            {error ? t.failedToLoad : t.notFound}
          </div>
        </div>
      </main>
    )
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  // Build family display data from populated API fields
  const familyDisplayData: FamilyData = {
    spouseId: (raw as any).spouseId?._id ?? (typeof (raw as any).spouseId === "string" ? (raw as any).spouseId : undefined),
    spouseName: (raw as any).spouseId?.fullName,
    motherId: (raw as any).motherId?._id ?? (typeof (raw as any).motherId === "string" ? (raw as any).motherId : undefined),
    motherName: (raw as any).motherId?.fullName,
    fatherId: (raw as any).fatherId?._id ?? (typeof (raw as any).fatherId === "string" ? (raw as any).fatherId : undefined),
    fatherName: (raw as any).fatherId?.fullName,
    siblingIds: ((raw as any).siblingIds ?? []).map((s: any) => ({
      id: s._id ?? s,
      name: s.fullName ?? "",
    })),
    childrenIds: ((raw as any).childrenIds ?? []).map((c: any) => ({
      id: c._id ?? c,
      name: c.fullName ?? "",
    })),
  }

  const hasFamilyLinks =
    familyDisplayData.spouseId ||
    familyDisplayData.motherId ||
    familyDisplayData.fatherId ||
    familyDisplayData.siblingIds.length > 0 ||
    familyDisplayData.childrenIds.length > 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/members">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t.backToMembers}
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {member.firstName} {member.middleName && `${member.middleName} `}{member.lastName}
                </h1>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant={
                      member.membershipStatus === "Active"
                        ? "default"
                        : member.membershipStatus === "Inactive"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {member.membershipStatus}
                  </Badge>
                  {member.membershipType && <Badge variant="outline">{member.membershipType}</Badge>}
                  {member.membershipNumber && (
                    <span className="text-sm text-muted-foreground">ID: {member.membershipNumber}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {member.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/members/${memberId}/edit`}>
                <Button className="gap-2">
                  <Edit className="w-4 h-4" />
                  {t.editProfile}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t.personalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.dateOfBirth && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.dateOfBirth}</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.dateOfBirth).toLocaleDateString()} ({calculateAge(member.dateOfBirth)} {t.yearsOld})
                      </p>
                    </div>
                  )}
                  {member.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.gender}</p>
                      <p className="text-foreground font-medium">{member.gender}</p>
                    </div>
                  )}
                  {member.maritalStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.maritalStatus}</p>
                      <p className="text-foreground font-medium">{member.maritalStatus}</p>
                    </div>
                  )}
                  {member.nationality && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.nationality}</p>
                      <p className="text-foreground font-medium">{member.nationality}</p>
                    </div>
                  )}
                  {member.occupation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.occupation}</p>
                      <p className="text-foreground font-medium">{member.occupation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(member.address || member.city || member.subCity) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t.addressInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {member.address && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t.streetAddress}</p>
                        <p className="text-foreground font-medium">{member.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {member.city && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t.city}</p>
                          <p className="text-foreground font-medium">{member.city}</p>
                        </div>
                      )}
                      {member.subCity && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t.subCity}</p>
                          <p className="text-foreground font-medium">{member.subCity}</p>
                        </div>
                      )}
                      {member.woreda && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t.woreda}</p>
                          <p className="text-foreground font-medium">{member.woreda}</p>
                        </div>
                      )}
                      {member.kebele && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t.kebele}</p>
                          <p className="text-foreground font-medium">{member.kebele}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Spiritual Journey */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  {t.spiritualJourney}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.salvationYearEthiopian && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.salvationYearEth}</p>
                      <p className="text-foreground font-medium">{member.salvationYearEthiopian}</p>
                    </div>
                  )}
                  {member.salvationDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.salvationDateGreg}</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.salvationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {member.baptismYearEthiopian && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.baptismYearEth}</p>
                      <p className="text-foreground font-medium">{member.baptismYearEthiopian}</p>
                    </div>
                  )}
                  {member.baptismDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.baptismDateGreg}</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.baptismDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {member.catechesisStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.catechesisStatus}</p>
                      <Badge variant={member.catechesisStatus === "Completed" ? "default" : "secondary"}>
                        {member.catechesisStatus}
                      </Badge>
                    </div>
                  )}
                  {member.discipleshipProgram && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.discipleshipProgram}</p>
                      <p className="text-foreground font-medium">{member.discipleshipProgram}</p>
                    </div>
                  )}
                  {member.mentor && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.mentor}</p>
                      <p className="text-foreground font-medium">{member.mentor}</p>
                    </div>
                  )}
                </div>
                {member.testimony && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.testimony}</p>
                      <p className="text-foreground whitespace-pre-wrap">{member.testimony}</p>
                    </div>
                  </>
                )}
                {member.faithJourneyNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.faithJourneyNotes}</p>
                      <p className="text-foreground whitespace-pre-wrap">{member.faithJourneyNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Service & Ministry */}
            {(member.currentServices?.length || member.desiredServices?.length || member.mentorshipBy) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    {t.serviceMinistry}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.currentServices && member.currentServices.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.currentServices}</p>
                      <div className="flex flex-wrap gap-2">
                        {member.currentServices.map((s) => <Badge key={s} variant="default">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {member.desiredServices && member.desiredServices.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.desiredServices}</p>
                      <div className="flex flex-wrap gap-2">
                        {member.desiredServices.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {member.mentorshipBy && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.mentorshipBy}</p>
                      <p className="text-foreground font-medium">{member.mentorshipBy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Education & Profession */}
            {(member.educationLevel || member.jobType || member.profession) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    {t.educationProfession}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {member.educationLevel && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t.educationLevel}</p>
                        <p className="text-foreground font-medium">{member.educationLevel}</p>
                      </div>
                    )}
                    {member.jobType && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{t.jobType}</p>
                        <p className="text-foreground font-medium">{member.jobType}</p>
                      </div>
                    )}
                    {member.profession && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">{t.profession}</p>
                        <p className="text-foreground font-medium">{member.profession}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Relationships */}
            <FamilyRelationships value={hasFamilyLinks ? familyDisplayData : emptyFamilyData()} readOnly />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Membership Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t.membership}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.joinDate}</p>
                  <p className="text-foreground font-medium">
                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.status}</p>
                  <Badge
                    variant={
                      member.membershipStatus === "Active"
                        ? "default"
                        : member.membershipStatus === "Inactive"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {member.membershipStatus}
                  </Badge>
                </div>
                {member.membershipType && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.type}</p>
                    <p className="text-foreground font-medium">{member.membershipType}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Church Grouping */}
            {(member.subCommunity || member.cellGroupName) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t.churchGrouping}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.subCommunity && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.subCommunity}</p>
                      <p className="text-foreground font-medium">{member.subCommunity}</p>
                    </div>
                  )}
                  {member.cellGroupType && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.groupType}</p>
                      <p className="text-foreground font-medium">{member.cellGroupType}</p>
                    </div>
                  )}
                  {member.cellGroupNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.cellGroupNumber}</p>
                      <p className="text-foreground font-medium">{member.cellGroupNumber}</p>
                    </div>
                  )}
                  {member.cellGroupName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.cellGroupName}</p>
                      <p className="text-foreground font-medium">{member.cellGroupName}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transfer Information */}
            {member.isTransfer && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {t.transferInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.transferFromChurch && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.fromChurch}</p>
                      <p className="text-foreground font-medium">{member.transferFromChurch}</p>
                    </div>
                  )}
                  {member.transferDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.transferDate}</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.transferDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial */}
            {member.paysTithe && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {t.financial}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.titheStatus}</p>
                    <Badge variant="default">{t.activeLabel}</Badge>
                  </div>
                  {member.titheAmount && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.amount}</p>
                      <p className="text-foreground font-medium">{member.titheAmount} {t.birr}</p>
                    </div>
                  )}
                  {member.titheFrequency && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.frequency}</p>
                      <p className="text-foreground font-medium">{member.titheFrequency}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {(member.emergencyContactName || member.emergencyContactPhone) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {t.emergencyContact}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.emergencyContactName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.name}</p>
                      <p className="text-foreground font-medium">{member.emergencyContactName}</p>
                    </div>
                  )}
                  {member.emergencyContactRelation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.relationship}</p>
                      <p className="text-foreground font-medium">{member.emergencyContactRelation}</p>
                    </div>
                  )}
                  {member.emergencyContactPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t.phone}</p>
                      <p className="text-foreground font-medium">{member.emergencyContactPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {member.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{t.notes}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
