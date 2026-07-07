"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type { FamilyMemberDto, FamilyUnitDto } from "@/lib/api/types"

function MemberNode({ member }: { member: FamilyMemberDto }) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  return (
    <Link
      href={`/members/${member._id}`}
      className="flex flex-col items-center gap-1.5 group w-24"
    >
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors overflow-hidden bg-card",
          member.sex === "male"
            ? "border-blue-400/60 group-hover:border-blue-500"
            : "border-pink-400/60 group-hover:border-pink-500"
        )}
      >
        {member.memberPicture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.memberPicture}
            alt={member.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <User
            className={cn(
              "w-7 h-7",
              member.sex === "male" ? "text-blue-500" : "text-pink-500"
            )}
          />
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {member.fullName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {tr.families.roles[member.role] || member.role}
          {member.age != null ? ` · ${member.age}` : ""}
        </p>
      </div>
    </Link>
  )
}

/**
 * Pure CSS/HTML two-generation family tree:
 * parents/spouses on top (joined by a horizontal line),
 * children below connected by vertical + horizontal connector lines.
 * Siblings-only units render as a flat row; unplaceable members go to a
 * "related members" strip.
 */
export function FamilyTree({ family }: { family: FamilyUnitDto }) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const parents = family.members.filter(
    (m) => m.role === "father" || m.role === "mother" || m.role === "spouse"
  )
  const children = family.members.filter((m) => m.role === "child")
  const siblings = family.members.filter((m) => m.role === "sibling")
  const relatives = family.members.filter((m) => m.role === "relative")

  const hasTree = parents.length > 0 && children.length > 0

  return (
    <div className="space-y-10">
      {/* Parents row */}
      {parents.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="relative flex items-start justify-center gap-12">
            {/* marriage line between exactly two parents */}
            {parents.length === 2 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 border-t-2 border-border" />
            )}
            {parents.map((p) => (
              <MemberNode key={p._id} member={p} />
            ))}
          </div>

          {/* Connector to children */}
          {hasTree && (
            <>
              <div className="w-0 h-8 border-l-2 border-border" />
              <div className="relative flex items-start justify-center gap-8 pt-8">
                {/* horizontal rail across children */}
                {children.length > 1 && (
                  <div
                    className="absolute top-0 border-t-2 border-border"
                    style={{
                      left: "3rem",
                      right: "3rem",
                    }}
                  />
                )}
                {children.map((c) => (
                  <div key={c._id} className="relative flex flex-col items-center">
                    {/* drop line from rail to each child */}
                    <div className="absolute -top-8 h-8 border-l-2 border-border" />
                    <MemberNode member={c} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Children with no parents in unit */}
      {!hasTree && children.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {tr.families.children}
          </h3>
          <div className="flex flex-wrap gap-6">
            {children.map((c) => (
              <MemberNode key={c._id} member={c} />
            ))}
          </div>
        </section>
      )}

      {/* Siblings row */}
      {siblings.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {tr.families.siblings}
          </h3>
          <div className="flex flex-wrap gap-6">
            {siblings.map((s) => (
              <MemberNode key={s._id} member={s} />
            ))}
          </div>
        </section>
      )}

      {/* Unplaceable members */}
      {relatives.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {tr.families.relatives}
          </h3>
          <div className="flex flex-wrap gap-6">
            {relatives.map((r) => (
              <MemberNode key={r._id} member={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
