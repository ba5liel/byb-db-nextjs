"use client"

import { useCallback, useEffect, useState } from "react"
import { StickyNote, Lock, Globe, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import {
  createMemberNote,
  deleteMemberNote,
  getMemberNotes,
  updateMemberNote,
  type MemberNoteDto,
  type NoteTaskStatus,
} from "@/lib/members-api"

export function MemberNotesPanel({ memberId }: { memberId: string }) {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const { toast } = useToast()
  const en = locale !== "am"

  const [notes, setNotes] = useState<MemberNoteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [body, setBody] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [status, setStatus] = useState<NoteTaskStatus>("not_started")

  const loadNotes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMemberNotes(memberId)
      setNotes(data)
    } catch (error) {
      toast({
        title: en ? "Could not load notes" : "ማስታወሻዎችን መጫን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [memberId, en, toast])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  async function handleCreate() {
    const text = body.trim()
    if (!text) return
    setSaving(true)
    try {
      await createMemberNote(memberId, text, isPublic, status)
      setBody("")
      setIsPublic(false)
      setStatus("not_started")
      await loadNotes()
      toast({
        title: en ? "Note saved" : "ማስታወሻ ተቀምጧል",
      })
    } catch (error) {
      toast({
        title: en ? "Could not save note" : "ማስታወሻ ማስቀመጥ አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisibility(note: MemberNoteDto) {
    try {
      await updateMemberNote(memberId, note._id, {
        isPublic: note.visibility !== "public",
      })
      await loadNotes()
    } catch (error) {
      toast({
        title: en ? "Could not update note" : "ማስታወሻ ማዘመን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  async function changeStatus(note: MemberNoteDto, next: NoteTaskStatus) {
    try {
      await updateMemberNote(memberId, note._id, { status: next })
      await loadNotes()
    } catch (error) {
      toast({
        title: en ? "Could not update status" : "ሁኔታ ማዘመን አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteMemberNote(memberId, noteId)
      await loadNotes()
    } catch (error) {
      toast({
        title: en ? "Could not delete note" : "ማስታወሻ መሰረዝ አልተቻለም",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <StickyNote className="w-5 h-5" />
          {en ? "Notes & tasks" : "ማስታወሻዎች እና ተግባሮች"}
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          {en
            ? "Notes are private to you unless you make them public. Your notes also appear on the Tasks page."
            : "ማስታወሻዎች ለእርስዎ ብቻ ናቸው፣ ህዝባዊ ካላደረጓቸው በስተቀር። ማስታወሻዎችዎ በተግባሮች ገጽ ላይም ይታያሉ።"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border/70 p-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={en ? "Write a note about this member…" : "ስለዚህ አባል ማስታወሻ ይጻፉ…"}
            rows={3}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="note-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="note-public" className="text-sm cursor-pointer">
                  {en ? "Make public" : "ህዝባዊ አድርግ"}
                </Label>
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as NoteTaskStatus)}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
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
            <Button size="sm" onClick={handleCreate} disabled={saving || !body.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : en ? "Add note" : "ማስታወሻ ጨምር"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {en ? "No notes yet." : "እስካሁን ማስታወሻ የለም።"}
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => {
              const mine = String(note.createdBy) === String(user?.id)
              const publicNote = note.visibility === "public"
              const noteStatus = note.status || "not_started"
              return (
                <li
                  key={note._id}
                  className="rounded-lg bg-muted/60 px-3 py-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          {publicNote ? (
                            <>
                              <Globe className="w-3 h-3" />
                              {en ? "Public" : "ህዝባዊ"}
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              {en ? "Private" : "የግል"}
                            </>
                          )}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {noteStatus === "done"
                            ? en
                              ? "Done"
                              : "ተጠናቋል"
                            : noteStatus === "in_progress"
                              ? en
                                ? "In progress"
                                : "በሂደት ላይ"
                              : en
                                ? "Not started"
                                : "አልተጀመረም"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {note.createdByName || (mine ? (en ? "You" : "እርስዎ") : "—")}
                          {" · "}
                          {new Date(note.createdAt).toLocaleString(
                            locale === "am" ? "am-ET" : undefined,
                          )}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                    </div>
                    {mine && (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Select
                          value={noteStatus}
                          onValueChange={(v) => changeStatus(note, v as NoteTaskStatus)}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">
                              {en ? "Not started" : "አልተጀመረም"}
                            </SelectItem>
                            <SelectItem value="in_progress">
                              {en ? "In progress" : "በሂደት ላይ"}
                            </SelectItem>
                            <SelectItem value="done">
                              {en ? "Done" : "ተጠናቋል"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => toggleVisibility(note)}
                          >
                            {publicNote
                              ? en
                                ? "Make private"
                                : "የግል አድርግ"
                              : en
                                ? "Make public"
                                : "ህዝባዊ አድርግ"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(note._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
