"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AudienceApi } from "@/lib/api/audience"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import { LOCALES, LocaleCode } from "@/lib/constants/locales"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AudienceType } from "@/lib/types/audience-types"
import Toaster from "@/components/toast"

export default function CreateAudiencePage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const { toasterRef, showToast } = useToast();

  const api = useMemo(() => new AudienceApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  const [name, setName] = useState("")
  const [local, setLocal] = useState<LocaleCode>("FR")
  const [definition, setDefinition] = useState("")
  const [audienceTypeId, setAudienceTypeId] = useState("")
  const [emailType, setEmailType] = useState<"campaign" | "automation" | "functional">("campaign")
  const [sql, setSql] = useState("")
  const [active, setActive] = useState(true)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([])

  useEffect(() => {
    const fetchAudienceTypes = async () => {
      try {
        const result = await audienceTypesApi.list({ limit: 10000 })
        setAudienceTypes(result.results)
      } catch {
        showToast("Error", "Failed to load audience types", "error")
      }
    }
    fetchAudienceTypes()
  }, [audienceTypesApi])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!audienceTypeId.trim()) newErrors.audienceTypeId = "Audience Type is required"
    if (!sql.trim()) newErrors.sql = "SQL is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const errorFields = Object.values(errors).join(", ");
      showToast("Error", `Please fix the following fields: ${errorFields}`, "error");

      return
    }

    setIsSubmitting(true)
    try {
      await api.create({ name, local, definition, audienceTypeId, emailType, sql, active, user: "system" })
      console.log("Audience created successfully")
      showToast("Success", "Audience created", "success")
      router.push(`/${env}/emails/audience`)
    } catch (err) {
      console.error("Failed to create audience:", err)
      showToast("Error", "Failed to create audience", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Create Audience</h1>
      <p className="text-muted-foreground">Add a new audience</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${errors.name ? 'text-destructive' : ''}`}>
            Name *
          </Label>
          <Input
            id="name"
            className={`w-full ${errors.name ? 'border-destructive' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
            }}
          />
        </div>

        {/* Local */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.local ? 'text-destructive' : ''}`}>Local *</Label>
          <Select value={local} onValueChange={(value) => setLocal(value as LocaleCode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Local" />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((loc) => (
                <SelectItem key={loc.code} value={loc.code}>
                  {loc.flag} {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Audience Type Dropdown */}
        <div>
          <Label htmlFor="audience_type" className={`mb-2 mt-4 ${errors.audienceTypeId ? 'text-destructive' : ''}`}>
            Audience Type *
          </Label>
          <Select value={audienceTypeId} onValueChange={(value) => setAudienceTypeId(value)}>
            <SelectTrigger className={`w-full ${errors.audienceTypeId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select Audience Type" />
            </SelectTrigger>
            <SelectContent>
              {audienceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email Type */}
        <div>
          <Label className="mb-2 mt-4">Email Type *</Label>
          <Select value={emailType} onValueChange={(value) => setEmailType(value as typeof emailType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Email Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="functional">Functional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SQL */}
        <div>
          <Label htmlFor="sql" className={`mb-2 mt-4 ${errors.sql ? 'text-destructive' : ''}`}>
            SQL *
          </Label>
          <Textarea
            id="sql"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className={`w-full ${errors.sql ? 'border-destructive' : ''} min-h-[100px]`}
            placeholder="Enter SQL query"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  )
}
