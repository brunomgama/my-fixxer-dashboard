"use client"

import { useState, useEffect, useMemo, startTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { AudienceApi } from "@/lib/api/audience"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LOCALES, LocaleCode } from "@/lib/constants/locales"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AudienceType {
  id: string
  name: string
}

export default function EditAudiencePage() {
  const params = useParams()
  const id = params.id as string

  const [formData, setFormData] = useState<{
    name: string
    local: LocaleCode
    emailType: "campaign" | "automation" | "functional"
    sql: string
    audienceTypeId: string
  }>({
    name: "",
    local: "FR",
    emailType: "campaign",
    sql: "",
    audienceTypeId: "",
  })

  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { env } = useEnvironment()

  const api = useMemo(() => new AudienceApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [audienceRes, typesRes] = await Promise.all([
          api.getOne(id),
          audienceTypesApi.list({ limit: 100 }),
        ])
        setFormData({
          name: audienceRes.name,
          local: audienceRes.local as LocaleCode,
          emailType: audienceRes.emailType,
          sql: audienceRes.sql,
          audienceTypeId: audienceRes.audienceTypeId,
        })
        setAudienceTypes(typesRes.results)
      } catch {
        toast.error("Failed to load audience data")
        router.back()
      }
    }
    fetchInitialData()
  }, [api, audienceTypesApi, id, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.audienceTypeId.trim()) newErrors.audienceTypeId = "Audience Type is required"
    if (!formData.sql.trim()) newErrors.sql = "SQL is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Redirecting to audience list")

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await api.update(id, {
        ...formData,
        active: true,
        user: "Bruno",
    })
    toast.success("Audience updated")
    // Ensure toast renders before redirecting
    router.push(`/${env}/emails/audience`)
    router.refresh()
    } catch {
      toast.error("Failed to update audience")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <h1 className="text-2xl font-semibold">Edit Audience</h1>
      <p className="text-muted-foreground">Update existing audience</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="mb-2 mt-4">Name *</Label>
          <Input
            id="name"
            className="w-full"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Local */}
        <div>
          <Label className="mb-2 mt-4">Local *</Label>
          <Select
            value={formData.local}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, local: value as LocaleCode }))}
          >
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

        {/* Audience Type */}
        <div>
          <Label className="mb-2 mt-4">Audience Type *</Label>
          <Select
            value={formData.audienceTypeId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, audienceTypeId: value }))}
          >
            <SelectTrigger className="w-full">
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
          {errors.audienceTypeId && <p className="text-sm text-destructive">{errors.audienceTypeId}</p>}
        </div>

        {/* Email Type */}
        <div>
          <Label className="mb-2 mt-4">Email Type *</Label>
          <Select
            value={formData.emailType}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, emailType: value as "campaign" | "automation" | "functional" }))
            }
          >
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
          <Label htmlFor="sql" className="mb-2 mt-4">SQL *</Label>
          <Textarea
            id="sql"
            value={formData.sql}
            onChange={(e) => setFormData((prev) => ({ ...prev, sql: e.target.value }))}
            className="w-full min-h-[100px]"
            placeholder="Enter SQL query"
          />
          {errors.sql && <p className="text-sm text-destructive">{errors.sql}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
