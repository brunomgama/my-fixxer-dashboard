"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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

export default function CreateAudiencePage() {
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
  const router = useRouter()
  const { env } = useEnvironment()

  const api = useMemo(() => new AudienceApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  useEffect(() => {
    const fetchAudienceTypes = async () => {
      try {
        const result = await audienceTypesApi.list({ limit: 100 })
        setAudienceTypes(result.results)
      } catch {
        toast.error("Failed to load audience types")
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
    if (!validateForm()) return
  
    setIsSubmitting(true)
    try {
      await api.create({
        name, local, definition, audienceTypeId,
        emailType, sql, active, user: "Bruno",
      })
      console.log("Audience created successfully")
      toast.success("Audience created")
      router.push(`/${env}/emails/audience`)
    } catch (err) {
      console.error("Failed to create audience:", err)
      toast.error("Failed to create audience")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <h1 className="text-2xl font-semibold">Create Audience</h1>
      <p className="text-muted-foreground">Add a new audience</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="mb-2 mt-4">Name *</Label>
          <Input
            id="name"
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Local */}
        <div>
          <Label className="mb-2 mt-4">Local *</Label>
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
          <Label className="mb-2 mt-4">Audience Type *</Label>
          <Select
            value={audienceTypeId}
            onValueChange={(value) => setAudienceTypeId(value)}
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
          <Label htmlFor="sql" className="mb-2 mt-4">SQL *</Label>
          <Textarea
            id="sql"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
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
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  )
}
