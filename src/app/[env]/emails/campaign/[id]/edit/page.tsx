"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { CampaignApi } from "@/lib/api/campaign"
import { AudienceApi } from "@/lib/api/audience"
import { SenderApi } from "@/lib/api/sender"
import { TemplateApi } from "@/lib/api/template"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LOCALES, LocaleCode } from "@/lib/constants/locales"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { Audience } from "@/lib/types/audience"
import { Sender } from "@/lib/types/sender"
import { Template } from "@/lib/types/template"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

type FormData = {
  name: string
  local: LocaleCode
  audienceId: string
  senderId: string
  senderAlias: string
  subject: string
  content: string
  templateId: string
  status: "draft" | "planned" | "archived" | "sending" | "sent"
}

export default function EditCampaignPage() {
  const { id } = useParams()
  const { env } = useEnvironment()
  const router = useRouter()

  const { toasterRef, showToast } = useToast();
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    local: "FR",
    audienceId: "",
    senderId: "",
    senderAlias: "",
    subject: "",
    content: "",
    templateId: "",
    status: "draft",
  })

  const [audiences, setAudiences] = useState<Audience[]>([])
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedSender, setSelectedSender] = useState<Sender | null>(null)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const api = useMemo(() => new CampaignApi(env), [env])
  const audienceApi = useMemo(() => new AudienceApi(env), [env])
  const senderApi = useMemo(() => new SenderApi(env), [env])
  const templateApi = useMemo(() => new TemplateApi(env), [env])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [campaignRes, audienceRes, senderRes, templateRes] = await Promise.all([
          api.getOne(id as string),
          audienceApi.list({ limit: 10000 }),
          senderApi.list({ limit: 10000 }),
          templateApi.list({ limit: 10000 }),
        ])
        
        setFormData({
          name: campaignRes.name,
          local: campaignRes.local as LocaleCode,
          audienceId: campaignRes.audienceId,
          senderId: campaignRes.senderId,
          senderAlias: campaignRes.senderAlias,
          subject: campaignRes.subject,
          content: campaignRes.content,
          templateId: campaignRes.templateId,
          status: campaignRes.status,
        })
        
        setAudiences(audienceRes.results)
        setSenders(senderRes.results)
        setTemplates(templateRes.results)

        // Set selected sender for alias dropdown
        const sender = senderRes.results.find(s => s.id === campaignRes.senderId)
        setSelectedSender(sender || null)
      } catch {
        showToast("Error", "Failed to load campaign data", "error");
        router.back()
      } finally {
        setLoading(false)
      }
    }
  
    fetchInitialData()
  }, [api, audienceApi, senderApi, templateApi, id, router])

  // Update sender alias options when sender changes
  useEffect(() => {
    if (formData.senderId) {
      const sender = senders.find(s => s.id === formData.senderId)
      setSelectedSender(sender || null)
      // Reset alias if current alias is not available for new sender
      if (sender && !sender.alias.includes(formData.senderAlias)) {
        setFormData(prev => ({ ...prev, senderAlias: "" }))
      }
    }
  }, [formData.senderId, senders, formData.senderAlias])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.audienceId.trim()) newErrors.audienceId = "Audience is required"
    if (!formData.senderId.trim()) newErrors.senderId = "Sender is required"
    if (!formData.senderAlias.trim()) newErrors.senderAlias = "Sender Alias is required"
    if (!formData.subject.trim()) newErrors.subject = "Subject is required"
    if (!formData.content.trim()) newErrors.content = "Content is required"
    if (!formData.templateId.trim()) newErrors.templateId = "Template is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const errorFields = Object.values(errors).join(", ")
      showToast("Error", `Please fix the following fields: ${errorFields}`, "error");
      return
    }

    setIsSubmitting(true)
    try {
      await api.update(id as string, {
        ...formData,
        user: "system",
      })
      showToast("Success", "Campaign updated", "success");
      router.push(`/${env}/emails/campaign`)
      router.refresh()
    } catch {
      showToast("Error", "Failed to update campaign", "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <RippleWaveLoader />

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Edit Campaign</h1>
      <p className="text-muted-foreground">Update existing campaign</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${errors.name ? 'text-destructive' : ''}`}>
            Name *
          </Label>
          <Input id="name" className={`w-full ${errors.name ? 'border-destructive' : ''}`} value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }))
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
            }}
            placeholder="Enter Name"/>
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Local */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.local ? 'text-destructive' : ''}`}>Local *</Label>
          <Select value={formData.local} onValueChange={(value) => setFormData((prev) => ({ ...prev, local: value as LocaleCode }))}>
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

        {/* Audience */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.audienceId ? 'text-destructive' : ''}`}>
            Audience *
          </Label>
          <Select value={formData.audienceId} onValueChange={(value) => setFormData((prev) => ({ ...prev, audienceId: value }))} >
            <SelectTrigger className={`w-full ${errors.audienceId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select Audience" />
            </SelectTrigger>
            <SelectContent>
              {audiences.map((audience) => (
                <SelectItem key={audience.id} value={audience.id}>
                  {audience.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.audienceId && <p className="text-sm text-destructive">{errors.audienceId}</p>}
        </div>

        {/* Sender */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.senderId ? 'text-destructive' : ''}`}>
            Sender *
          </Label>
          <Select value={formData.senderId} onValueChange={(value) => setFormData((prev) => ({ ...prev, senderId: value }))}>
            <SelectTrigger className={`w-full ${errors.senderId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select Sender" />
            </SelectTrigger>
            <SelectContent>
              {senders.map((sender) => (
                <SelectItem key={sender.id} value={sender.id}>
                  {sender.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.senderId && <p className="text-sm text-destructive">{errors.senderId}</p>}
        </div>

        {/* Sender Alias */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.senderAlias ? 'text-destructive' : ''}`}>
            Sender Alias *
          </Label>
          <Select value={formData.senderAlias} onValueChange={(value) => setFormData((prev) => ({ ...prev, senderAlias: value }))} disabled={!selectedSender}>
            <SelectTrigger className={`w-full ${errors.senderAlias ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={selectedSender ? "Select Sender Alias" : "Select a sender first"} />
            </SelectTrigger>
            <SelectContent>
              {selectedSender?.alias.map((alias) => (
                <SelectItem key={alias} value={alias}>
                  {alias}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.senderAlias && <p className="text-sm text-destructive">{errors.senderAlias}</p>}
        </div>

        {/* Template */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.templateId ? 'text-destructive' : ''}`}>
            Template *
          </Label>
          <Select value={formData.templateId} onValueChange={(value) => setFormData((prev) => ({ ...prev, templateId: value }))}>
            <SelectTrigger className={`w-full ${errors.templateId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.templateId && <p className="text-sm text-destructive">{errors.templateId}</p>}
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="subject" className={`mb-2 mt-4 ${errors.subject ? 'text-destructive' : ''}`}>
            Subject *
          </Label>
          <Input 
            id="subject" 
            value={formData.subject} 
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))} 
            className={`w-full ${errors.subject ? 'border-destructive' : ''}`} 
            placeholder="Enter email subject" 
          />
          {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content" className={`mb-2 mt-4 ${errors.content ? 'text-destructive' : ''}`}>
            Content *
          </Label>
          <Textarea 
            id="content" 
            value={formData.content} 
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} 
            className={`w-full ${errors.content ? 'border-destructive' : ''} min-h-[150px]`} 
            placeholder="Enter email content" 
          />
          {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
        </div>

        {/* Status */}
        {/* <div>
          <Label className="mb-2 mt-4">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as "draft" | "planned" | "archived" | "sending" | "sent" }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

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