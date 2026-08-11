"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  StickyNote,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { isSuperAdmin } from "@/lib/role-utils"
import {
  getMyNotes,
  updateMemberNote,
  type MemberNoteDto,
  type NoteTaskStatus,
} from "@/lib/members-api"
import { cn } from "@/lib/utils"

function memberIdOf(note: MemberNoteDto): string {
  return typeof note.memberId === "object" ? note.memberId._id : note.memberId
}

function memberNameOf(note: MemberNoteDto): string {
  if (typeof note.memberId === "object") {
    return note.memberId.fullName || "—"
  }
  return "—"
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

function TaskCard({
  note,
  en,
  locale,
  onStatusChange,
}: {
  note: MemberNoteDto
  en: boolean
  locale: string
  onStatusChange: (note: MemberNoteDto, status: NoteTaskStatus) => void
}) {
  const status = note.status || "not_started"
  const mid = memberIdOf(note)

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        status === "done" && "opacity-80",
        status === "in_progress" && "border-amber-500/40 bg-amber-500/5",
        status === "not_started" && "border-sky-500/30 bg-sky-500/5",
      )}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/members/${mid}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {memberNameOf(note)}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(note.updatedAt || note.createdAt).toLocaleString(
                locale === "am" ? "am-ET" : undefined,
              )}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px]",
              status === "done" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
              status === "in_progress" && "border-amber-500/40 text-amber-700 dark:text-amber-400",
            )}
          >
            {statusLabel(status, en)}
          </Badge>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5" />
            {note.visibility === "public"
              ? en
                ? "Public"
                : "ህዝባዊ"
              : en
                ? "Private"
                : "የግል"}
          </div>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(note, v as NoteTaskStatus)}
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
        </div>
      </div>
    </article>
  )
}

export default function TasksPage() {
  const { locale } = useLanguage()
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const en = locale !== "am"

  const [notes, setNotes] = useState<MemberNoteDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSuperAdmin(user?.role)) {
      router.replace("/")
    }
  }, [user?.role, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setNotes(await getMyNotes())
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
    () => notes.filter((n) => (n.status || "not_started") !== "done"),
    [notes],
  )
  const done = useMemo(
    () => notes.filter((n) => n.status === "done"),
    [notes],
  )

  async function onStatusChange(note: MemberNoteDto, status: NoteTaskStatus) {
    const mid = memberIdOf(note)
    try {
      await updateMemberNote(mid, note._id, { status })
      setNotes((prev) =>
        prev.map((n) => (n._id === note._id ? { ...n, status } : n)),
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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-sky-500/10 px-6 py-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              {en ? "Your notes as tasks" : "ማስታወሻዎችዎ እንደ ተግባር"}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {en ? "Tasks" : "ተግባሮች"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {en
                ? "Notes you write on members appear here. Track follow-ups with Not started, In progress, and Done."
                : "በአባላት ላይ የጻፏቸው ማስታወሻዎች እዚህ ይታያሉ። በአልተጀመረም፣ በሂደት ላይ እና ተጠናቋል ይከታተሉ።"}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-background/80 px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums">{pending.length}</p>
              <p className="text-xs text-muted-foreground">
                {en ? "Pending" : "በመጠባበቅ"}
              </p>
            </div>
            <div className="rounded-2xl bg-background/80 px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums text-emerald-600">
                {done.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {en ? "Done" : "ተጠናቋል"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <StickyNote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">
            {en ? "No tasks yet" : "እስካሁን ተግባር የለም"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {en
              ? "Open a member profile and add a note to start tracking tasks."
              : "የአባል መገለጫ ይክፈቱ እና ማስታወሻ በመጨመር ተግባር ይጀምሩ።"}
          </p>
          <Link href="/members" className="mt-4 inline-block">
            <Button size="sm">{en ? "Go to members" : "ወደ አባላት ሂድ"}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold">
                {en ? "Pending tasks" : "በመጠባበቅ ላይ ያሉ ተግባሮች"}
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {pending.length}
              </Badge>
            </div>
            {pending.length === 0 ? (
              <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                {en ? "Nothing pending — nice work." : "ምንም በመጠባበቅ የለም።"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {pending.map((note) => (
                  <TaskCard
                    key={note._id}
                    note={note}
                    en={en}
                    locale={locale}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-lg font-semibold">
                {en ? "Done tasks" : "የተጠናቀቁ ተግባሮች"}
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {done.length}
              </Badge>
            </div>
            {done.length === 0 ? (
              <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                {en ? "Completed tasks will land here." : "የተጠናቀቁ ተግባሮች እዚህ ይታያሉ።"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {done.map((note) => (
                  <TaskCard
                    key={note._id}
                    note={note}
                    en={en}
                    locale={locale}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
