"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { useMembers } from "@/lib/members-context"
import type { Member } from "@/lib/types"

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const { getMember } = useMembers()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (memberId === "new") {
      router.push("/members/new")
      return
    }

    const foundMember = getMember(memberId)
    setMember(foundMember || null)
    setLoading(false)
  }, [memberId, getMember, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">Loading member...</div>
        </div>
      </main>
    )
  }

  if (!member) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">Member not found</div>
        </div>
      </main>
    )
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/members">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Members
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              {/* Profile Photo Placeholder */}
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {member.firstName} {member.middleName && `${member.middleName} `}
                  {member.lastName}
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
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.dateOfBirth && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.dateOfBirth).toLocaleDateString()} ({calculateAge(member.dateOfBirth)} years
                        old)
                      </p>
                    </div>
                  )}
                  {member.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gender</p>
                      <p className="text-foreground font-medium">{member.gender}</p>
                    </div>
                  )}
                  {member.maritalStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Marital Status</p>
                      <p className="text-foreground font-medium">{member.maritalStatus}</p>
                    </div>
                  )}
                  {member.nationality && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Nationality</p>
                      <p className="text-foreground font-medium">{member.nationality}</p>
                    </div>
                  )}
                  {member.occupation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Occupation</p>
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
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {member.address && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Street Address</p>
                        <p className="text-foreground font-medium">{member.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {member.city && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">City</p>
                          <p className="text-foreground font-medium">{member.city}</p>
                        </div>
                      )}
                      {member.subCity && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Sub-City</p>
                          <p className="text-foreground font-medium">{member.subCity}</p>
                        </div>
                      )}
                      {member.woreda && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Woreda</p>
                          <p className="text-foreground font-medium">{member.woreda}</p>
                        </div>
                      )}
                      {member.kebele && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Kebele</p>
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
                  Spiritual Journey (መንፈሳዊ ጉዞ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.salvationYearEthiopian && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ጌታን ያገኙበት አመት (ዓ.ም)</p>
                      <p className="text-foreground font-medium">{member.salvationYearEthiopian}</p>
                    </div>
                  )}
                  {member.salvationDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Salvation Date (Gregorian)</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.salvationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {member.baptismYearEthiopian && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">የተጠመቁበት አመት (ዓ.ም)</p>
                      <p className="text-foreground font-medium">{member.baptismYearEthiopian}</p>
                    </div>
                  )}
                  {member.baptismDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Baptism Date (Gregorian)</p>
                      <p className="text-foreground font-medium">{new Date(member.baptismDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {member.confirmationDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Confirmation Date</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.confirmationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {member.catechesisStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">የካቴኬሲስ ሁኔታ - Catechesis Status</p>
                      <Badge variant={member.catechesisStatus === "Completed" ? "default" : "secondary"}>
                        {member.catechesisStatus}
                      </Badge>
                    </div>
                  )}
                  {member.discipleshipProgram && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">የደቀመዝሙርነት ፕሮግራም - Discipleship Program</p>
                      <p className="text-foreground font-medium">{member.discipleshipProgram}</p>
                    </div>
                  )}
                  {member.discipleshipLevel && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Discipleship Level</p>
                      <p className="text-foreground font-medium">{member.discipleshipLevel}</p>
                    </div>
                  )}
                  {member.mentor && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mentor/Pastor</p>
                      <p className="text-foreground font-medium">{member.mentor}</p>
                    </div>
                  )}
                </div>
                {member.testimony && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Testimony</p>
                      <p className="text-foreground whitespace-pre-wrap">{member.testimony}</p>
                    </div>
                  </>
                )}
                {member.faithJourneyNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Faith Journey Notes</p>
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
                    Service & Ministry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.currentServices && member.currentServices.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current Services</p>
                      <div className="flex flex-wrap gap-2">
                        {member.currentServices.map((service) => (
                          <Badge key={service} variant="default">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {member.desiredServices && member.desiredServices.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Desired Services</p>
                      <div className="flex flex-wrap gap-2">
                        {member.desiredServices.map((service) => (
                          <Badge key={service} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {member.mentorshipBy && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mentorship By</p>
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
                    Education & Profession
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {member.educationLevel && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Education Level</p>
                        <p className="text-foreground font-medium">{member.educationLevel}</p>
                      </div>
                    )}
                    {member.jobType && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Job Type</p>
                        <p className="text-foreground font-medium">{member.jobType}</p>
                      </div>
                    )}
                    {member.profession && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Profession</p>
                        <p className="text-foreground font-medium">{member.profession}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Membership Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Join Date</p>
                  <p className="text-foreground font-medium">{new Date(member.joinDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
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
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
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
                    Church Grouping
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.subCommunity && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sub-Community</p>
                      <p className="text-foreground font-medium">{member.subCommunity}</p>
                    </div>
                  )}
                  {member.cellGroupType && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cell Group Type</p>
                      <p className="text-foreground font-medium">{member.cellGroupType}</p>
                    </div>
                  )}
                  {member.cellGroupNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cell Group Number</p>
                      <p className="text-foreground font-medium">{member.cellGroupNumber}</p>
                    </div>
                  )}
                  {member.cellGroupName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cell Group Name</p>
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
                    Transfer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.transferFromChurch && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">From Church</p>
                      <p className="text-foreground font-medium">{member.transferFromChurch}</p>
                    </div>
                  )}
                  {member.transferDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Transfer Date</p>
                      <p className="text-foreground font-medium">
                        {new Date(member.transferDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Family Information */}
            {(member.spouseName || member.numberOfChildren) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.spouseName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Spouse</p>
                      <p className="text-foreground font-medium">{member.spouseName}</p>
                    </div>
                  )}
                  {member.numberOfChildren !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Number of Children</p>
                      <p className="text-foreground font-medium">{member.numberOfChildren}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial Contribution */}
            {member.paysTithe && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Contribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tithe Status</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                  {member.titheAmount && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="text-foreground font-medium">{member.titheAmount} Birr</p>
                    </div>
                  )}
                  {member.titheFrequency && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Frequency</p>
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
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.emergencyContactName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Name</p>
                      <p className="text-foreground font-medium">{member.emergencyContactName}</p>
                    </div>
                  )}
                  {member.emergencyContactRelation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Relationship</p>
                      <p className="text-foreground font-medium">{member.emergencyContactRelation}</p>
                    </div>
                  )}
                  {member.emergencyContactPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="text-foreground font-medium">{member.emergencyContactPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {member.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
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
