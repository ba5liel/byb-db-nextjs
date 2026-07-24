"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { FamilyTree } from "@/lib/families-api"
import { initial } from "./family-labels"

type Locale = "en" | "am"

/**
 * Renders a family tree as a set of generational rows using flexbox.
 * Generations are computed by walking the edge list out from the root member:
 * parents sit above, spouses/siblings share the root's row, children below.
 * Edge semantics: { from, to, type } reads as "`to` is the <type> of `from`".
 */
export function FamilyTreeView({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  const nodeById = new Map(tree.nodes.map((n) => [n._id, n]))

  // Assign a generation level to each node relative to the root (level 0).
  const level = new Map<string, number>()
  level.set(tree.rootMemberId, 0)
  const delta: Record<FamilyTree["edges"][number]["type"], number> = {
    parent: -1, // `to` is a parent of `from` -> one generation up
    child: 1, // `to` is a child of `from` -> one generation down
    spouse: 0,
    sibling: 0,
  }

  // Propagate levels with a bounded BFS over the (small) edge set.
  let changed = true
  let guard = 0
  while (changed && guard < tree.nodes.length + 2) {
    changed = false
    guard += 1
    for (const edge of tree.edges) {
      if (level.has(edge.from) && !level.has(edge.to)) {
        level.set(edge.to, (level.get(edge.from) as number) + delta[edge.type])
        changed = true
      }
      if (level.has(edge.to) && !level.has(edge.from)) {
        level.set(edge.from, (level.get(edge.to) as number) - delta[edge.type])
        changed = true
      }
    }
  }

  // Direct relationship of a node to the root, when there is a root edge.
  const directType = new Map<string, FamilyTree["edges"][number]["type"]>()
  for (const edge of tree.edges) {
    if (edge.from === tree.rootMemberId) directType.set(edge.to, edge.type)
  }

  const relationLabel = (id: string): string => {
    if (id === tree.rootMemberId) return locale === "am" ? "ይህ አባል" : "This member"
    const t = directType.get(id)
    if (t) {
      const map: Record<FamilyTree["edges"][number]["type"], { en: string; am: string }> = {
        parent: { en: "Parent", am: "ወላጅ" },
        child: { en: "Child", am: "ልጅ" },
        spouse: { en: "Spouse", am: "የትዳር ጓደኛ" },
        sibling: { en: "Sibling", am: "ወንድም/እህት" },
      }
      return map[t][locale]
    }
    const lvl = level.get(id) ?? 0
    if (lvl < -1) return locale === "am" ? "ቅድመ አያት" : "Grandparent"
    if (lvl === -1) return locale === "am" ? "ወላጅ" : "Parent"
    if (lvl === 1) return locale === "am" ? "ልጅ" : "Child"
    if (lvl > 1) return locale === "am" ? "የልጅ ልጅ" : "Grandchild"
    return locale === "am" ? "ዘመድ" : "Relative"
  }

  // Group nodes by level, ancestors (lowest number) first: parents sit
  // on the top row, children on the bottom. Within a row, men come
  // first so a couple reads father-then-mother.
  const levels = new Map<number, string[]>()
  for (const node of tree.nodes) {
    const lvl = level.get(node._id) ?? 0
    if (!levels.has(lvl)) levels.set(lvl, [])
    ;(levels.get(lvl) as string[]).push(node._id)
  }
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b)
  for (const ids of levels.values()) {
    ids.sort((a, b) => {
      const sexA = nodeById.get(a)?.sex === "male" ? 0 : 1
      const sexB = nodeById.get(b)?.sex === "male" ? 0 : 1
      if (sexA !== sexB) return sexA - sexB
      return (nodeById.get(a)?.fullName ?? "").localeCompare(nodeById.get(b)?.fullName ?? "")
    })
  }

  // Muted blue for men, muted pink for women.
  const genderClasses = (sex?: string) =>
    sex === "male"
      ? "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-950/60"
      : sex === "female"
        ? "border-pink-200 bg-pink-50 hover:bg-pink-100 dark:border-pink-900 dark:bg-pink-950/40 dark:hover:bg-pink-950/60"
        : "border-border bg-card hover:bg-muted"

  const avatarClasses = (sex?: string) =>
    sex === "male"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
      : sex === "female"
        ? "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200"
        : ""

  return (
    <div className="flex flex-col items-center gap-6 overflow-x-auto py-2">
      {sortedLevels.map((lvl, idx) => (
        <div key={lvl} className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-stretch justify-center gap-3">
            {(levels.get(lvl) as string[]).map((id) => {
              const node = nodeById.get(id)
              if (!node) return null
              const isRoot = id === tree.rootMemberId
              return (
                <Link
                  key={id}
                  href={`/members/${id}`}
                  className={`flex w-40 flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${genderClasses(node.sex)} ${
                    isRoot ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={node.memberPicture} alt={node.fullName} />
                    <AvatarFallback className={avatarClasses(node.sex)}>
                      {initial(node.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{node.fullName}</p>
                    <p className="text-xs text-muted-foreground">{relationLabel(id)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
          {idx < sortedLevels.length - 1 && <div className="h-6 w-px bg-border" aria-hidden />}
        </div>
      ))}
    </div>
  )
}
