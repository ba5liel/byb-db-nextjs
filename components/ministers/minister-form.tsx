"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchMembers } from "@/lib/api/hooks"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import type {
  CreateMinisterDto,
  MinisterRole,
  ContractType,
} from "@/lib/api/types"

const MINISTER_ROLE_VALUES: MinisterRole[] = [
  "pastor",
  "elder",
  "deacon",
  "evangelist",
  "teacher",
  "other",
]
const CONTRACT_TYPE_VALUES: ContractType[] = [
  "full_time",
  "part_time",
  "volunteer",
  "contract",
]

export type MinisterFormData = Partial<CreateMinisterDto>

interface MinisterFormProps {
  formData: MinisterFormData
  onChange: (data: MinisterFormData) => void
  mode: "create" | "edit"
  /** Display name of the linked member (edit mode, where memberId is fixed) */
  memberName?: string
}

export function MinisterForm({ formData, onChange, mode, memberName }: MinisterFormProps) {
  const { locale } = useLanguage()
  const tr = getTranslation(locale)

  const [memberSearch, setMemberSearch] = useState("")
  const { data: memberResults } = useSearchMembers(
    mode === "create" ? memberSearch : "",
    5
  )

  const set = (patch: MinisterFormData) => onChange({ ...formData, ...patch })

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label htmlFor="memberSearch">{tr.ministers.selectMember}</Label>
        {mode === "edit" ? (
          <Input value={memberName || ""} disabled className="mt-1" />
        ) : (
          <div className="space-y-2 mt-1">
            <Input
              id="memberSearch"
              placeholder={tr.ministers.searchMember}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            {memberResults?.data && memberResults.data.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {memberResults.data.map((member) => (
                  <div
                    key={member._id}
                    className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      set({ memberId: member._id })
                      setMemberSearch(member.fullName)
                    }}
                  >
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>{tr.ministers.ministerRole}</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => set({ role: value as MinisterRole })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINISTER_ROLE_VALUES.map((v) => (
              <SelectItem key={v} value={v}>
                {tr.ministers.roles[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.role === "other" && (
        <div>
          <Label htmlFor="customRole">{tr.ministers.customRole}</Label>
          <Input
            id="customRole"
            className="mt-1"
            value={formData.customRole || ""}
            onChange={(e) => set({ customRole: e.target.value })}
            placeholder={tr.ministers.customRolePlaceholder}
          />
        </div>
      )}

      <div>
        <Label htmlFor="ordinationDate">{tr.ministers.ordinationDate}</Label>
        <Input
          id="ordinationDate"
          type="date"
          className="mt-1"
          value={
            formData.ordinationDate
              ? new Date(formData.ordinationDate).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) => set({ ordinationDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="ordainingBody">{tr.ministers.ordainingBody}</Label>
        <Input
          id="ordainingBody"
          className="mt-1"
          value={formData.ordainingBody || ""}
          onChange={(e) => set({ ordainingBody: e.target.value })}
          placeholder={tr.ministers.ordainingBodyPlaceholder}
        />
      </div>

      <div className="col-span-2">
        <Label htmlFor="responsibilities">{tr.ministers.responsibilities}</Label>
        <Textarea
          id="responsibilities"
          className="mt-1"
          value={formData.responsibilities || ""}
          onChange={(e) => set({ responsibilities: e.target.value })}
          placeholder={tr.ministers.responsibilitiesPlaceholder}
        />
      </div>

      <div>
        <Label>{tr.ministers.contractType}</Label>
        <Select
          value={formData.contractType}
          onValueChange={(value) => set({ contractType: value as ContractType })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPE_VALUES.map((v) => (
              <SelectItem key={v} value={v}>
                {tr.ministers.contractTypes[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="salary">{tr.ministers.salary}</Label>
        <Input
          id="salary"
          type="number"
          className="mt-1"
          value={formData.salary ?? ""}
          onChange={(e) =>
            set({ salary: e.target.value ? parseFloat(e.target.value) : undefined })
          }
          placeholder={tr.ministers.salaryPlaceholder}
        />
      </div>

      <div className="col-span-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSystemAccess"
            checked={formData.hasSystemAccess}
            onCheckedChange={(checked) => set({ hasSystemAccess: checked as boolean })}
          />
          <Label htmlFor="hasSystemAccess">{tr.ministers.enableSystemAccess}</Label>
        </div>
      </div>

      {formData.hasSystemAccess && mode === "create" && (
        <>
          <div>
            <Label htmlFor="minister-email">{tr.ministers.emailForAccess}</Label>
            <Input
              id="minister-email"
              type="email"
              className="mt-1"
              value={formData.email || ""}
              onChange={(e) => set({ email: e.target.value })}
              placeholder={tr.ministers.emailPlaceholder}
            />
          </div>
          <div>
            <Label htmlFor="minister-password">{tr.ministers.password}</Label>
            <Input
              id="minister-password"
              type="password"
              className="mt-1"
              value={formData.password || ""}
              onChange={(e) => set({ password: e.target.value })}
              placeholder={tr.ministers.passwordPlaceholder}
            />
          </div>
        </>
      )}
    </div>
  )
}
