"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { AudienceApi } from "@/lib/api/audience"
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
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/code-block"
import { Pencil, PencilOff } from "lucide-react"
import { AudienceType } from "@/lib/types/audience-types"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

type FormData = {
  name: string
  local: LocaleCode
  emailType: "campaign" | "automation" | "functional"
  sql: string
  audienceTypeId: string
}

export default function EditAudiencePage() {
  const { id } = useParams()
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()

  const { toasterRef, showToast } = useToast();
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    local: "FR",
    emailType: "campaign",
    sql: "",
    audienceTypeId: "",
  })

  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([])
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)

  const api = useMemo(() => new AudienceApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [audienceRes, typesRes] = await Promise.all([
          api.getOne(id as string),
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
        showToast(t("common.error"), t("audience.failedToLoad"), "error");
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
    if (!formData.sql.trim()) newErrors.sql = t("validation.sqlRequired")
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
        active: true,
        user: "system",
      })
      showToast(t("common.success"), t("audience.audienceUpdated"), "success");
      router.push(`/${env}/emails/audience`)
      router.refresh()
    } catch {
      showToast(t("common.error"), t("audience.failedToUpdate"), "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <RippleWaveLoader />

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">{t("audience.editAudience")}</h1>
      <p className="text-muted-foreground">{t("audience.updateExistingAudience")}</p>
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
            placeholder={t("audience.enterName")}/>
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

        {/* SQL */}
        <CodeBlock>
          <CodeBlockGroup className="border-border border-b px-4 py-2">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                  {t("audience.sql")}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setEditing((prev) => !prev)}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                {editing ? <PencilOff className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            </div>
          </CodeBlockGroup>


          {editing ? (
            <div className="px-4 py-4">
              <Textarea id="sql" value={formData.sql} onChange={(e) => setFormData((prev) => ({ ...prev, sql: e.target.value }))} className="w-full min-h-[100px]" placeholder={t("audience.enterSQLQuery")} />
              {errors.sql && (
                <p className="text-sm text-destructive mt-2">{errors.sql}</p>
              )}
            </div>
          ) : (
            <CodeBlockCode code={formData.sql} language="sql" theme="github-dark" />
          )}
        </CodeBlock>


        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("audience.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
