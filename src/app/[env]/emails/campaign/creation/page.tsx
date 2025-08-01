"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { CampaignApi } from "@/lib/api/campaign"
import { AudienceApi } from "@/lib/api/audience"
import { SenderApi } from "@/lib/api/sender"
import { TemplateApi } from "@/lib/api/template"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
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
import { Audience } from "@/lib/types/audience"
import { Sender } from "@/lib/types/sender"
import { Template } from "@/lib/types/template"
import Toaster from "@/components/toast"

export default function CreateCampaignPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()
  const { toasterRef, showToast } = useToast();

  const api = useMemo(() => new CampaignApi(env), [env])
  const audienceApi = useMemo(() => new AudienceApi(env), [env])
  const senderApi = useMemo(() => new SenderApi(env), [env])
  const templateApi = useMemo(() => new TemplateApi(env), [env])

  const [name, setName] = useState("")
  const [local, setLocal] = useState<LocaleCode>("FR")
  const [audienceId, setAudienceId] = useState("")
  const [senderId, setSenderId] = useState("")
  const [senderAlias, setSenderAlias] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [status, setStatus] = useState<"draft" | "planned" | "archived" | "sending" | "sent">("draft")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [audiences, setAudiences] = useState<Audience[]>([])
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedSender, setSelectedSender] = useState<Sender | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [audienceResult, senderResult, templateResult] = await Promise.all([
          audienceApi.list({ limit: 10000 }),
          senderApi.list({ limit: 10000 }),
          templateApi.list({ limit: 10000 })
        ])
        setAudiences(audienceResult.results)
        setSenders(senderResult.results)
        setTemplates(templateResult.results)
      } catch {
        showToast(t("common.error"), t("campaigns.failedToLoadData"), "error")
      }
    }
    fetchData()
  }, [audienceApi, senderApi, templateApi, showToast, t])

  useEffect(() => {
    if (senderId) {
      const sender = senders.find(s => s.id === senderId)
      setSelectedSender(sender || null)
      setSenderAlias("")
    }
  }, [senderId, senders])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = t("validation.nameRequired")
    if (!audienceId.trim()) newErrors.audienceId = t("audience.selectAudience")
    if (!senderId.trim()) newErrors.senderId = t("campaigns.selectSender")
    if (!senderAlias.trim()) newErrors.senderAlias = t("campaigns.senderAliasRequired")
    if (!subject.trim()) newErrors.subject = t("campaigns.subjectRequired")
    if (!content.trim()) newErrors.content = t("campaigns.contentRequired")
    if (!templateId.trim()) newErrors.templateId = t("campaigns.templateRequired")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const errorFields = Object.values(errors).join(", ");
      showToast(t("common.error"), t("forms.pleaseFixFields") + ": " + errorFields, "error");
      return
    }

    setIsSubmitting(true)
    try {
      await api.create({ 
        name, 
        local, 
        audienceId, 
        senderId, 
        senderAlias, 
        subject, 
        content, 
        templateId,
        status: "draft",
        user: "system" 
      })
      showToast(t("common.success"), t("campaigns.campaignCreated"), "success")
      router.push(`/${env}/emails/campaign`)
    } catch (err) {
      showToast(t("common.error"), t("campaigns.failedToCreate"), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">{t("campaigns.createCampaign")}</h1>
      <p className="text-muted-foreground">{t("campaigns.addCampaign")}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${errors.name ? 'text-destructive' : ''}`}>
            {t("common.name")} *
          </Label>
          <Input
            id="name"
            className={`w-full ${errors.name ? 'border-destructive' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
            }}
            placeholder={t("sendProcess.enterCampaignName")}
          />
        </div>

        {/* Local */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.local ? 'text-destructive' : ''}`}>{t("audience.local")} *</Label>
          <Select value={local} onValueChange={(value) => setLocal(value as LocaleCode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("audience.selectLocal")} />
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
          <Label htmlFor="audience" className={`mb-2 mt-4 ${errors.audienceId ? 'text-destructive' : ''}`}>
            {t("navigation.audience")} *
          </Label>
          <Select value={audienceId} onValueChange={(value) => setAudienceId(value)}>
            <SelectTrigger className={`w-full ${errors.audienceId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t("sendProcess.selectAudience")} />
            </SelectTrigger>
            <SelectContent>
              {audiences.map((audience) => (
                <SelectItem key={audience.id} value={audience.id}>
                  {audience.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sender */}
        <div>
          <Label htmlFor="sender" className={`mb-2 mt-4 ${errors.senderId ? 'text-destructive' : ''}`}>
            {t("campaigns.sender")} *
          </Label>
          <Select value={senderId} onValueChange={(value) => setSenderId(value)}>
            <SelectTrigger className={`w-full ${errors.senderId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t("sendProcess.selectSender")} />
            </SelectTrigger>
            <SelectContent>
              {senders.map((sender) => (
                <SelectItem key={sender.id} value={sender.id}>
                  {sender.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sender Alias */}
        <div>
          <Label htmlFor="senderAlias" className={`mb-2 mt-4 ${errors.senderAlias ? 'text-destructive' : ''}`}>
            {t("senders.alias")} *
          </Label>
          <Select value={senderAlias} onValueChange={(value) => setSenderAlias(value)} disabled={!selectedSender}>
            <SelectTrigger className={`w-full ${errors.senderAlias ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={selectedSender ? t("sendProcess.selectAnAlias") : t("campaigns.selectSenderFirst")} />
            </SelectTrigger>
            <SelectContent>
              {selectedSender?.alias.map((alias) => (
                <SelectItem key={alias} value={alias}>
                  {alias}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template */}
        <div>
          <Label htmlFor="template" className={`mb-2 mt-4 ${errors.templateId ? 'text-destructive' : ''}`}>
            {t("campaigns.template")} *
          </Label>
          <Select value={templateId} onValueChange={(value) => setTemplateId(value)}>
            <SelectTrigger className={`w-full ${errors.templateId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t("sendProcess.selectTemplate")} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="subject" className={`mb-2 mt-4 ${errors.subject ? 'text-destructive' : ''}`}>
            {t("campaigns.subject")} *
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full ${errors.subject ? 'border-destructive' : ''}`}
            placeholder={t("sendProcess.enterEmailSubject")}
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content" className={`mb-2 mt-4 ${errors.content ? 'text-destructive' : ''}`}>
            {t("campaigns.content")} *
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full ${errors.content ? 'border-destructive' : ''} min-h-[150px]`}
            placeholder={t("sendProcess.enterEmailContent")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("audience.creating") : t("common.create")}
          </Button>
        </div>
      </form>
    </div>
  )
}