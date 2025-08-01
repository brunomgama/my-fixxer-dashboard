"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import Toaster from "@/components/toast"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { useToast } from "@/hooks/useToast"

export default function EditAudienceTypePage() {
  const { id } = useParams()
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()
  const api = new AudienceTypesApi(env)
  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<{ name: string }>({ name: "" })
  const [name, setName] = useState<string>("")
  
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasFetched, setHasFetched] = useState<boolean>(false)

  useEffect(() => {
    const fetchAudienceType = async () => {
      try {
        const fetchedData = await api.getOne(id as string)
        setData({ name: fetchedData.name })
        setName(fetchedData.name)
        setHasFetched(true)
      } catch (error) {
        showToast(t("common.error"), t("audienceTypes.failedToLoad"), "error");
        router.back()
      } finally {
        setLoading(false)
      }
    }

    if (id && !hasFetched) {
      fetchAudienceType()
    }
  }, [id, api, router, hasFetched, showToast, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError(t("validation.nameRequired"))
      showToast(t("common.error"), t("validation.nameRequired"), "error");
      return
    }

    setIsSubmitting(true)

    try {
      await api.update(id as string, { name: name.trim(), user: "system" })
      showToast(t("common.success"), t("audienceTypes.audienceTypeUpdated"), "success");
      router.back()
    } catch (error) {
      showToast(t("common.error"), t("audienceTypes.failedToUpdate"), "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <RippleWaveLoader />

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">{t("audienceTypes.editAudienceType")}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="w-full">
          <Label htmlFor="name" className={`mb-2 mt-4 ${error ? 'text-destructive' : ''}`}>
            {t("common.name")} *
          </Label>
          <Input id="name" className={`w-full ${error ? 'border-destructive' : ''}`} value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError("")
            }}/>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("audience.updating") : t("common.update")}
          </Button>
        </div>
      </form>
    </div>
  )
}
