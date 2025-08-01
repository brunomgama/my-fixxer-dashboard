"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { TemplateApi } from "@/lib/api/template"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LOCALES, LocaleCode } from "@/lib/constants/locales"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { AudienceType } from "@/lib/types/audience-types"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

type FormData = {
  name: string
  local: LocaleCode
  audienceTypeId: string
  emailType: "campaign" | "automation" | "functional"
  header: string
  footer: string
  unsubscribe: string
  status: "draft" | "published" | "archived"
}

export default function EditTemplatePage() {
  const { id } = useParams()
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()

  const { toasterRef, showToast } = useToast();
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    local: "FR",
    audienceTypeId: "",
    emailType: "campaign",
    header: "",
    footer: "",
    unsubscribe: "",
    status: "draft",
  })

  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([])
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const api = useMemo(() => new TemplateApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [templateRes, typesRes] = await Promise.all([
          api.getOne(id as string),
          audienceTypesApi.list({ limit: 100 }),
        ])
        setFormData({
          name: templateRes.name,
          local: templateRes.local as LocaleCode,
          audienceTypeId: templateRes.audienceTypeId,
          emailType: templateRes.emailType,
          header: templateRes.header,
          footer: templateRes.footer,
          unsubscribe: templateRes.unsubscribe || "",
          status: templateRes.status,
        })
        setAudienceTypes(typesRes.results)
      } catch {
        showToast(t("common.error"), t("templates.failedToLoad"), "error");
        router.back()
      } finally {
        setLoading(false)
      }
    }
  
    fetchInitialData()
  }, [api, audienceTypesApi, id, router, showToast, t])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = t("validation.nameRequired")
    if (!formData.audienceTypeId.trim()) newErrors.audienceTypeId = t("validation.audienceTypeRequired")
    if (!formData.header.trim()) newErrors.header = t("templates.headerRequired")
    if (!formData.footer.trim()) newErrors.footer = t("templates.footerRequired")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const errorFields = Object.values(errors).join(", ")
      showToast(t("common.error"), t("forms.pleaseFixFields") + ": " + errorFields, "error");
      return
    }

    setIsSubmitting(true)
    try {
      await api.update(id as string, {
        ...formData,
        unsubscribe: formData.unsubscribe || undefined,
        user: "system",
      })
      showToast(t("common.success"), t("templates.templateUpdated"), "success");
      router.push(`/${env}/emails/template`)
      router.refresh()
    } catch {
      showToast(t("common.error"), t("templates.failedToUpdate"), "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <RippleWaveLoader />

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">{t("templates.editTemplate")}</h1>
      <p className="text-muted-foreground">{t("templates.updateExistingTemplate")}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${errors.name ? 'text-destructive' : ''}`}>
            {t("common.name")} *
          </Label>
          <Input id="name" className={`w-full ${errors.name ? 'border-destructive' : ''}`} value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }))
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
            }}
            placeholder={t("templates.enterTemplateName")}/>
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        {/* Local */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.local ? 'text-destructive' : ''}`}>{t("audience.local")} *</Label>
          <Select value={formData.local} onValueChange={(value) => setFormData((prev) => ({ ...prev, local: value as LocaleCode }))}>
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

        {/* Audience Type */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.audienceTypeId ? 'text-destructive' : ''}`}>
            {t("audience.audienceType")} *
          </Label>
          <Select value={formData.audienceTypeId} onValueChange={(value) => setFormData((prev) => ({ ...prev, audienceTypeId: value }))} >
            <SelectTrigger className={`w-full ${errors.audienceTypeId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t("audience.selectAudienceType")} />
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
          <Label className="mb-2 mt-4">{t("audience.emailType")} *</Label>
          <Select value={formData.emailType} onValueChange={(value) => setFormData((prev) => ({ ...prev, emailType: value as "campaign" | "automation" | "functional" }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("audience.selectEmailType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campaign">{t("senders.campaign")}</SelectItem>
              <SelectItem value="automation">{t("senders.automation")}</SelectItem>
              <SelectItem value="functional">{t("senders.functional")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Header */}
        <div>
          <Label htmlFor="header" className={`mb-2 mt-4 ${errors.header ? 'text-destructive' : ''}`}>
            {t("templates.header")} *
          </Label>
          <Textarea 
            id="header" 
            value={formData.header} 
            onChange={(e) => setFormData((prev) => ({ ...prev, header: e.target.value }))} 
            className={`w-full ${errors.header ? 'border-destructive' : ''} min-h-[100px]`} 
            placeholder={t("templates.enterTemplateHeader")} 
          />
          {errors.header && <p className="text-sm text-destructive">{errors.header}</p>}
        </div>

        {/* Footer */}
        <div>
          <Label htmlFor="footer" className={`mb-2 mt-4 ${errors.footer ? 'text-destructive' : ''}`}>
            {t("templates.footer")} *
          </Label>
          <Textarea 
            id="footer" 
            value={formData.footer} 
            onChange={(e) => setFormData((prev) => ({ ...prev, footer: e.target.value }))} 
            className={`w-full ${errors.footer ? 'border-destructive' : ''} min-h-[100px]`} 
            placeholder={t("templates.enterTemplateFooter")} 
          />
          {errors.footer && <p className="text-sm text-destructive">{errors.footer}</p>}
        </div>

        {/* Unsubscribe */}
        <div>
          <Label htmlFor="unsubscribe" className="mb-2 mt-4">
            {t("navigation.unsubscribe")}
          </Label>
          <Textarea 
            id="unsubscribe" 
            value={formData.unsubscribe} 
            onChange={(e) => setFormData((prev) => ({ ...prev, unsubscribe: e.target.value }))} 
            className="w-full min-h-[100px]" 
            placeholder={t("templates.enterUnsubscribeContent")} 
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("templates.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}