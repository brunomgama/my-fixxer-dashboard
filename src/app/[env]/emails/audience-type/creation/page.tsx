"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function CreateAudienceTypePage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()
  const api = new AudienceTypesApi(env)
  const { toasterRef, showToast } = useToast();

  const [name, setName] = useState("")
  
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast(t("common.error"), t("validation.nameRequired"), "error");
      setError(t("validation.nameRequired"))
      return
    }

    setIsSubmitting(true)
    try {
      await api.create({ name, user: "system" })
      showToast(t("common.success"), t("audienceTypes.createAudienceType"), "success");
      router.back()
    } catch (err) {
      showToast(t("common.error"), t("audienceTypes.failedToUpdate"), "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">{t("audienceTypes.createAudienceType")}</h1>
      <p className="text-muted-foreground">{t("audienceTypes.description")}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${error ? 'text-destructive' : ''}`}>
            {t("common.name")} *
          </Label>
          <Input id="name" className={`w-full ${error ? 'border-destructive' : ''}`} value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError("")
            }} />
        </div>
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
