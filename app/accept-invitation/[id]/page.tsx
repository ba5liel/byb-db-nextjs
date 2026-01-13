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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
              <CardTitle className="text-2xl">Processing Invitation</CardTitle>
              <CardDescription>Please wait while we accept your invitation...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Invitation Accepted!</CardTitle>
              <CardDescription>
                You have successfully joined the organization. Redirecting to dashboard...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Invitation Error</CardTitle>
              <CardDescription>There was a problem accepting your invitation</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {invitation && status === "loading" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Organization</p>
                    <p className="text-sm text-gray-600">{invitation.organizationName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm text-green-700">
                  Welcome to {invitation?.organizationName || "the organization"}!
                </p>
                <p className="text-xs text-green-600 mt-2">You will be redirected shortly...</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium">Error Details:</p>
                <p className="text-sm text-red-600 mt-1">
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
                <p className="text-xs text-gray-500">
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


