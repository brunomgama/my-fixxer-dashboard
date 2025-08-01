"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { TemplateApi } from "@/lib/api/template"
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

export default function CreateTemplatePage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const { toasterRef, showToast } = useToast();

  const api = useMemo(() => new TemplateApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  const [name, setName] = useState("")
  const [local, setLocal] = useState<LocaleCode>("FR")
  const [audienceTypeId, setAudienceTypeId] = useState("")
  const [emailType, setEmailType] = useState<"campaign" | "automation" | "functional">("campaign")
  const [header, setHeader] = useState("")
  const [footer, setFooter] = useState("")
  const [unsubscribe, setUnsubscribe] = useState("")
//   const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")

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
    if (!header.trim()) newErrors.header = "Header is required"
    if (!footer.trim()) newErrors.footer = "Footer is required"

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
      await api.create({ 
        name, 
        local, 
        audienceTypeId, 
        emailType, 
        header, 
        footer, 
        unsubscribe: unsubscribe || undefined,
        status : "draft",
        user: "system" 
      })
      console.log("Template created successfully")
      showToast("Success", "Template created", "success")
      router.push(`/${env}/emails/template`)
    } catch (err) {
      console.error("Failed to create template:", err)
      showToast("Error", "Failed to create template", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Create Template</h1>
      <p className="text-muted-foreground">Add a new email template</p>
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

        {/* <div>
          <Label className="mb-2 mt-4">Status *</Label>
          <Select value={status}">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        {/* Header */}
        <div>
          <Label htmlFor="header" className={`mb-2 mt-4 ${errors.header ? 'text-destructive' : ''}`}>
            Header *
          </Label>
          <Textarea
            id="header"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            className={`w-full ${errors.header ? 'border-destructive' : ''} min-h-[100px]`}
            placeholder="Enter header content"
          />
        </div>

        {/* Footer */}
        <div>
          <Label htmlFor="footer" className={`mb-2 mt-4 ${errors.footer ? 'text-destructive' : ''}`}>
            Footer *
          </Label>
          <Textarea
            id="footer"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            className={`w-full ${errors.footer ? 'border-destructive' : ''} min-h-[100px]`}
            placeholder="Enter footer content"
          />
        </div>

        {/* Unsubscribe */}
        <div>
          <Label htmlFor="unsubscribe" className="mb-2 mt-4">
            Unsubscribe
          </Label>
          <Textarea
            id="unsubscribe"
            value={unsubscribe}
            onChange={(e) => setUnsubscribe(e.target.value)}
            className="w-full min-h-[100px]"
            placeholder="Enter unsubscribe content (optional)"
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