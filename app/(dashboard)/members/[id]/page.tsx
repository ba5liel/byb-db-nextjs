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
  UserMinus,
  RotateCcw,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMembers } from "@/lib/members-context"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { MemberNotesPanel } from "@/components/members/member-notes-panel"
import { restoreMember, updateMemberStatus } from "@/lib/members-api"
import type { Member } from "@/lib/types"

const LEAVE_STATUS_OPTIONS = [
  { value: "inactive", labelEn: "Inactive", labelAm: "እንቅስቃሴ የለውም" },
  { value: "transferred_out", labelEn: "Transferred Out", labelAm: "ተዛውሯል" },
  { value: "removed", labelEn: "Removed", labelAm: "ተወግዷል" },
  { value: "deceased", labelEn: "Deceased", labelAm: "አልፏል" },
] as const

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const { getMember, refreshMembers } = useMembers()
  const { locale } = useLanguage()
  const { toast } = useToast()
  const en = locale !== "am"
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveStatus, setLeaveStatus] = useState("inactive")
  const [leaveReason, setLeaveReason] = useState("")
  const [savingStatus, setSavingStatus] = useState(false)

  async function reload() {
    const foundMember = await getMember(memberId)
    setMember(foundMember || null)
  }

  useEffect(() => {
    async function loadMember() {
      if (memberId === "new") {
        router.push("/members/new")
        return
      }

      const foundMember = await getMember(memberId)
      setMember(foundMember || null)
      setLoading(false)
    }
    loadMember()
  }, [memberId, getMember, router])

  async function handleMarkLeft() {
    if (!leaveReason.trim()) {
      toast({
        title: en ? "Reason required" : "ምክንያት ያስፈልጋል",
        variant: "destructive",
      })
      return
    }
    setSavingStatus(true)
    try {
      await updateMemberStatus(
        memberId,
        leaveStatus as "inactive" | "removed" | "transferred_out" | "deceased",
        leaveReason.trim(),
      )
      await refreshMembers()
      await reload()
      setLeaveOpen(false)
      setLeaveReason("")
      toast({ title: en ? "Member marked as left" : "አባሉ እንደወጣ ተመዝግቧል" })
    } catch (error) {
      toast({
        title: en ? "Could not update status" : "ሁኔታ ማዘመን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSavingStatus(false)
    }
  }

  async function handleRestore() {
    setSavingStatus(true)
    try {
      if (member?.membershipStatus === "Removed") {
        await restoreMember(memberId)
      } else {
        await updateMemberStatus(memberId, "active")
      }
      await refreshMembers()
      await reload()
      toast({ title: en ? "Member restored" : "አባሉ ተመልሷል" })
    } catch (error) {
      toast({
        title: en ? "Could not restore member" : "አባልን መመለስ አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSavingStatus(false)
    }
  }

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

  const isLeft = member.membershipStatus !== "Active"
  const backHref = isLeft ? "/members/left" : "/members"

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
          <Link href={backHref}>
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              {isLeft
                ? en
                  ? "Back to Left Members"
                  : "ወደ የወጡ አባላት ተመለስ"
                : en
                  ? "Back to Members"
                  : "ወደ አባላት ተመለስ"}
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
            <div className="flex flex-wrap gap-2">
              {!isLeft ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLeaveOpen(true)}
                >
                  <UserMinus className="w-4 h-4" />
                  {en ? "Mark as left" : "እንደወጣ ምዝገባ"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRestore}
                  disabled={savingStatus}
                >
                  <RotateCcw className="w-4 h-4" />
                  {en ? "Restore member" : "አባልን መልስ"}
                </Button>
              )}
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
            {isLeft && (
              <Card className="border-0 shadow-lg border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserMinus className="w-5 h-5" />
                    {en ? "Leave details" : "የመውጫ ዝርዝር"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {en ? "Left on" : "የወጡበት ቀን"}
                    </p>
                    <p className="font-medium">
                      {member.statusChangeDate
                        ? new Date(member.statusChangeDate).toLocaleString(
                            locale === "am" ? "am-ET" : undefined,
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {en ? "Status" : "ሁኔታ"}
                    </p>
                    <p className="font-medium">{member.membershipStatus}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      {en ? "Reason" : "ምክንያት"}
                    </p>
                    <p className="font-medium whitespace-pre-wrap">
                      {member.leaveReason || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                      <p className="text-foreground font-medium capitalize">
                        {member.nationality === "non_ethiopian" ? "Non-Ethiopian" : "Ethiopian"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address & Church Grouping */}
            {(member.physicalAddress || member.woreda || member.sefer || member.subCommunity) && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address & Church Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.physicalAddress && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Physical Address</p>
                        <p className="text-foreground font-medium">{member.physicalAddress}</p>
                      </div>
                    )}
                    {member.woreda && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Woreda</p>
                        <p className="text-foreground font-medium">{member.woreda}</p>
                      </div>
                    )}
                    {member.sefer && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sefer</p>
                        <p className="text-foreground font-medium">{member.sefer}</p>
                      </div>
                    )}
                    {member.subCommunity && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Church Group</p>
                        <Badge variant="secondary">{member.subCommunity}</Badge>
                      </div>
                    )}
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
                      <p className="text-sm text-muted-foreground mb-1">የደኅንነት ዓመት (ዓ.ም) - Salvation Year</p>
                      <p className="text-foreground font-medium">{member.salvationYearEthiopian}</p>
                    </div>
                  )}
                  {member.baptismYearEthiopian && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">የጥምቀት ዓመት (ዓ.ም) - Baptism Year</p>
                      <p className="text-foreground font-medium">{member.baptismYearEthiopian}</p>
                    </div>
                  )}
                  {member.catechesisStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">የደቀመዝሙርነት ሁኔታ - Discipleship Status</p>
                      <Badge variant={member.catechesisStatus === "Completed" ? "default" : "secondary"}>
                        {member.catechesisStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service & Ministry */}
            {member.currentServices && member.currentServices.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Service & Ministry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

            <MemberNotesPanel memberId={memberId} />

            {member.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{en ? "Legacy notes" : "የቀድሞ ማስታወሻ"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{member.notes}</p>
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
                      <p className="text-sm text-muted-foreground mb-1">Church Group</p>
                      <p className="text-foreground font-medium">{member.subCommunity}</p>
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
            {member.numberOfChildren !== undefined && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Number of Children</p>
                    <p className="text-foreground font-medium">{member.numberOfChildren}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Contribution */}
            {member.paysTithe === "yes" && (
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
                  {member.emergencyContactPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="text-foreground font-medium">{member.emergencyContactPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{en ? "Mark member as left" : "አባልን እንደወጣ ምዝገባ"}</DialogTitle>
            <DialogDescription>
              {en
                ? "Their profile is kept. They will appear under Left Members."
                : "መገለጫቸው ይቀመጣል። በየወጡ አባላት ስር ይታያሉ።"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{en ? "Leave status" : "የመውጫ ሁኔታ"}</Label>
              <Select value={leaveStatus} onValueChange={setLeaveStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {en ? opt.labelEn : opt.labelAm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{en ? "Reason" : "ምክንያት"}</Label>
              <Textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={3}
                placeholder={en ? "Why did they leave?" : "ለምን ወጡ?"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              {en ? "Cancel" : "ሰርዝ"}
            </Button>
            <Button onClick={handleMarkLeft} disabled={savingStatus}>
              {en ? "Confirm" : "አረጋግጥ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
