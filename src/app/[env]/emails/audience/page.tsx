"use client"

import Link from "next/link"
import { useEffect, useState, useCallback, useMemo } from "react"
import { IconPlus, IconUser, IconEdit, IconTrash } from "@tabler/icons-react"

import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { AudienceApi } from "@/lib/api/audience"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { ShieldCheck, ShieldX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Audience } from "@/lib/types/audience"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function AudiencePage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const api = useMemo(() => new AudienceApi(env), [env])

  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<Audience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchAudiences = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.list({ limit: 50 })
      setData(result.results)
    } catch {
      setError(t("audience.failedToLoad"))
    } finally {
      setLoading(false)
    }
  }, [api, t])

  useEffect(() => {
    setLoading(true)
    fetchAudiences()
  }, [fetchAudiences, env])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      showToast(t("common.success"), t("audience.audienceDeleted"), "success")
      fetchAudiences()
    } catch {
      showToast(t("common.error"), t("audience.failedToDelete"), "error")
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      const currentAudience = await api.getOne(id)

      const updatedAudience = {
        ...currentAudience,
        active: !currentAudience.active,
        user: "system",
      }

      await api.update(id, updatedAudience)

      const message = currentAudience.active ? t("audience.audienceDeactivated") : t("audience.audienceCreated")
      showToast(t("common.success"), message, "success")
      fetchAudiences()
    } catch (err) {
      showToast(t("common.error"), t("audience.failedToDeactivate"), "error")
    }
  }

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <Toaster ref={toasterRef} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("audience.title")}</h1>
          <p className="text-muted-foreground">{t("audience.description")}</p>
        </div>
        <Link href={`/${env}/emails/audience/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            {t("audience.addAudience")}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("audience.local")}</TableHead>
              <TableHead>{t("audience.emailType")}</TableHead>
              <TableHead>{t("audience.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((audience) => (
                <TableRow key={audience.id}>
                  <TableCell className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground shrink-0" />
                    {audience.name}
                  </TableCell>

                  <TableCell>
                    <span>
                      {audience.local === "FR" ? "🇫🇷 " : audience.local === "NL" ? "🇳🇱 " : "🌍 "}
                    </span>
                    {audience.local}
                  </TableCell>

                  <TableCell className="capitalize">{audience.emailType}</TableCell>

                  <TableCell>
                    {audience.active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        {t("common.active")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        <ShieldX className="w-3.5 h-3.5 mr-1" />
                        {t("common.inactive")}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    <Link href={`/${env}/emails/audience/${audience.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setSelectedId(audience.id)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeactivate(audience.id)}>
                      {audience.active ? t("audience.deactivate") : t("audience.activate")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t("audience.noAudiencesFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteModal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={t("audience.deleteAudienceType")}
        description={t("audience.deleteConfirmation")}
      />
    </div>
  )
}
