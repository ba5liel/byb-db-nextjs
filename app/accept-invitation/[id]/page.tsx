"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react"

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = params.id as string

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [invitation, setInvitation] = useState<any>(null)

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        setStatus("loading")

        // Get invitation details first
        const invitationResponse = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        })

        if (invitationResponse.data) {
          setInvitation(invitationResponse.data)
        }

        // Accept the invitation
        const result = await authClient.organization.acceptInvitation({
          invitationId,
        })

        if (result.error) {
          setErrorMessage(result.error.message || "Failed to accept invitation")
          setStatus("error")
          toast.error(result.error.message || "Failed to accept invitation")
        } else {
          setStatus("success")
          toast.success("Invitation accepted successfully!")

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to accept invitation"
        setErrorMessage(message)
        setStatus("error")
        toast.error(message)
      }
    }

    if (invitationId) {
      acceptInvitation()
    }
  }, [invitationId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl">Processing Invitation</CardTitle>
              <CardDescription>Please wait while we accept your invitation...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-8 w-8 text-green-700 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">Invitation Accepted!</CardTitle>
              <CardDescription>
                You have successfully joined the organization. Redirecting to dashboard...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">Invitation Error</CardTitle>
              <CardDescription>There was a problem accepting your invitation</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {invitation && status === "loading" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Organization</p>
                    <p className="text-sm text-muted-foreground">{invitation.organizationName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Welcome to {invitation?.organizationName || "the organization"}!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">You will be redirected shortly...</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4">
                <p className="text-sm text-destructive font-medium">Error Details:</p>
                <p className="text-sm text-destructive mt-1">
                  {errorMessage || "An unexpected error occurred"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push("/login")} variant="outline">
                  Go to Login
                </Button>
                <Button onClick={() => router.push("/")} variant="ghost">
                  Go to Home
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  If you continue to experience issues, please contact your organization administrator.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


