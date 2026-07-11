import type { ChurchGroup, FamilyMember, FamilyRole } from "@/lib/types"

type Locale = "en" | "am"

/** Family role labels, localized. */
export function roleLabel(role: FamilyRole, locale: Locale): string {
  const labels: Record<FamilyRole, { en: string; am: string }> = {
    father: { en: "Father", am: "አባት" },
    mother: { en: "Mother", am: "እናት" },
    child: { en: "Child", am: "ልጅ" },
    sibling: { en: "Sibling", am: "ወንድም/እህት" },
    spouse: { en: "Spouse", am: "የትዳር ጓደኛ" },
    other: { en: "Other", am: "ሌላ" },
  }
  return labels[role]?.[locale] ?? role
}

export const FAMILY_ROLES: FamilyRole[] = [
  "father",
  "mother",
  "child",
  "sibling",
  "spouse",
  "other",
]

/** Church group display labels (same in both locales). */
export const CHURCH_GROUP_LABELS: Record<ChurchGroup, string> = {
  jemmo: "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alpha: "Alpha",
}

export const CHURCH_GROUPS: ChurchGroup[] = ["jemmo", "bethel", "weyira", "alpha"]

/** First-letter avatar initial from a name. */
export function initial(name?: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?"
}

/**
 * Normalize a FamilyMember whose `memberId` may be a bare id string or a
 * populated member object into a flat, display-ready shape.
 */
export function memberInfo(fm: FamilyMember): {
  id: string
  fullName: string
  membershipNumber?: string
  phoneNumber?: string
  memberPicture?: string
} {
  if (typeof fm.memberId === "string") {
    return { id: fm.memberId, fullName: "" }
  }
  const m = fm.memberId
  return {
    id: m._id,
    fullName: m.fullName || "",
    membershipNumber: m.membershipNumber,
    phoneNumber: m.phoneNumber,
    memberPicture: m.memberPicture,
  }
}
