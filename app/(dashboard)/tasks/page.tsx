"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, StickyNote, Users, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import {
  getMyNotes,
  updateMemberNote,
  type MemberNoteDto,
  type NoteTaskStatus,
} from "@/lib/members-api"
import {
  getMyFamilyNotes,
  updateFamilyNote,
  type FamilyNoteDto,
} from "@/lib/families-api"
import { cn } from "@/lib/utils"

type TaskKind = "member" | "family"

type UnifiedTask = {
  kind: TaskKind
  note: MemberNoteDto | FamilyNoteDto
  targetId: string
  targetName: string
}

function memberIdOf(note: MemberNoteDto): string {
  return typeof note.memberId === "object" ? note.memberId._id : note.memberId
}

function memberNameOf(note: MemberNoteDto): string {
  if (typeof note.memberId === "object") {
    return note.memberId.fullName || "—"
  }
  return "—"
}

function familyIdOf(note: FamilyNoteDto): string {
  return typeof note.familyId === "object" ? note.familyId._id : note.familyId
}

function familyNameOf(note: FamilyNoteDto, en: boolean): string {
  if (typeof note.familyId === "object") {
    return note.familyId.name || (en ? "Unnamed family" : "ያልተሰየመ ቤተሰብ")
  }
  return en ? "Family" : "ቤተሰብ"
}

function statusLabel(status: NoteTaskStatus | undefined, en: boolean) {
  switch (status) {
    case "in_progress":
      return en ? "In progress" : "በሂደት ላይ"
    case "done":
      return en ? "Done" : "ተጠናቋል"
    default:
      return en ? "Not started" : "አልተጀመረም"
  }
}

function TaskRow({
  task,
  en,
  locale,
  onStatusChange,
}: {
  task: UnifiedTask
  en: boolean
  locale: string
  onStatusChange: (task: UnifiedTask, status: NoteTaskStatus) => void
}) {
  const status = task.note.status || "not_started"
  const href = task.kind === "member" ? `/members/${task.targetId}` : `/families/${task.targetId}`

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
            >
              {task.kind === "member" ? (
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <UsersRound className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {task.targetName}
            </Link>
            <Badge variant="outline" className="text-[10px] font-normal">
              {task.kind === "member"
                ? en
                  ? "Member"
                  : "አባል"
                : en
                  ? "Family"
                  : "ቤተሰብ"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(task.note.updatedAt || task.note.createdAt).toLocaleString(
                locale === "am" ? "am-ET" : undefined,
              )}
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {task.note.body}
          </p>
          <p className="text-xs text-muted-foreground">
            {task.note.visibility === "public"
              ? en
                ? "Public note"
                : "ህዝባዊ ማስታወሻ"
              : en
                ? "Private note"
                : "የግል ማስታወሻ"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(task, v as NoteTaskStatus)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">
                {en ? "Not started" : "አልተጀመረም"}
              </SelectItem>
              <SelectItem value="in_progress">
                {en ? "In progress" : "በሂደት ላይ"}
              </SelectItem>
              <SelectItem value="done">{en ? "Done" : "ተጠናቋል"}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground sm:hidden">
            {statusLabel(status, en)}
          </span>
        </div>
      </div>
    </li>
  )
}

export default function TasksPage() {
  const { locale } = useLanguage()
  const { toast } = useToast()
  const en = locale !== "am"

  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [memberNotes, familyNotes] = await Promise.all([
        getMyNotes(),
        getMyFamilyNotes(),
      ])
      const unified: UnifiedTask[] = [
        ...memberNotes.map((note) => ({
          kind: "member" as const,
          note,
          targetId: memberIdOf(note),
          targetName: memberNameOf(note),
        })),
        ...familyNotes.map((note) => ({
          kind: "family" as const,
          note,
          targetId: familyIdOf(note),
          targetName: familyNameOf(note, en),
        })),
      ].sort(
        (a, b) =>
          new Date(b.note.updatedAt || b.note.createdAt).getTime() -
          new Date(a.note.updatedAt || a.note.createdAt).getTime(),
      )
      setTasks(unified)
    } catch (error) {
      toast({
        title: en ? "Could not load tasks" : "ተግባሮችን መጫን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [en, toast])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(
    () => tasks.filter((t) => (t.note.status || "not_started") !== "done"),
    [tasks],
  )
  const done = useMemo(
    () => tasks.filter((t) => t.note.status === "done"),
    [tasks],
  )
  const visible = showDone ? done : pending

  async function onStatusChange(task: UnifiedTask, status: NoteTaskStatus) {
    try {
      if (task.kind === "member") {
        await updateMemberNote(task.targetId, task.note._id, { status })
      } else {
        await updateFamilyNote(task.targetId, task.note._id, { status })
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.note._id === task.note._id
            ? { ...t, note: { ...t.note, status } }
            : t,
        ),
      )
    } catch (error) {
      toast({
        title: en ? "Could not update status" : "ሁኔታ ማዘመን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {en ? "Tasks" : "ተግባሮች"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {en
            ? "Notes you write on members and families appear here as follow-ups."
            : "በአባላት እና ቤተሰቦች ላይ የጻፏቸው ማስታወሻዎች እዚህ እንደ ክትትል ይታያሉ።"}
        </p>
      </div>

      <div
        role="tablist"
        aria-label={en ? "Task status" : "የተግባር ሁኔታ"}
        className="relative grid w-full grid-cols-2 rounded-lg bg-[#e8e8ed] p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] dark:bg-muted"
      >
        {/* Sliding white thumb */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-card",
            showDone && "translate-x-[calc(100%+4px)]",
          )}
        />

        <button
          type="button"
          role="tab"
          aria-selected={!showDone}
          onClick={() => setShowDone(false)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            !showDone
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/80",
          )}
        >
          {en ? "Pending" : "ያልተጠናቀቁ"}
          <span className="tabular-nums opacity-60">{pending.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={showDone}
          onClick={() => setShowDone(true)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            showDone
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/80",
          )}
        >
          {en ? "Done" : "የተጠናቀቁ"}
          <span className="tabular-nums opacity-60">{done.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <StickyNote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <h2 className="text-base font-medium">
            {en ? "No tasks yet" : "እስካሁን ተግባር የለም"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {en
              ? "Open a member or family and add a note to start tracking tasks."
              : "የአባል ወይም ቤተሰብ መገለጫ ይክፈቱ እና ማስታወሻ በመጨመር ተግባር ይጀምሩ።"}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/members">
              <Button size="sm" variant="outline">
                {en ? "Members" : "አባላት"}
              </Button>
            </Link>
            <Link href="/families">
              <Button size="sm" variant="outline">
                {en ? "Families" : "ቤተሰቦች"}
              </Button>
            </Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          {showDone
            ? en
              ? "No completed tasks yet."
              : "እስካሁን የተጠናቀቀ ተግባር የለም።"
            : en
              ? "Nothing pending."
              : "ምንም በመጠባበቅ የለም።"}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border bg-card">
          {visible.map((task) => (
            <TaskRow
              key={`${task.kind}-${task.note._id}`}
              task={task}
              en={en}
              locale={locale}
              onStatusChange={onStatusChange}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
