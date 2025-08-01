"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { IconPlus, IconUser, IconEdit, IconTrash } from "@tabler/icons-react"

import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { useToast } from "@/hooks/useToast"
import { AudienceType } from "@/lib/types/audience-types"
import Toaster from "@/components/toast"

export default function AudienceTypesPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const api = useMemo(() => new AudienceTypesApi(env), [env]);

  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<AudienceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchAudienceTypes = useCallback(async () => {
    try {
      const result = await api.list({ limit: 50 });
      setData(result.results);
    } catch {
      setError(t("audienceTypes.failedToFetch"));
      showToast(t("common.error"), t("audienceTypes.failedToFetch"), "error");
    } finally {
      setLoading(false);
    }
  }, [api, showToast, t]);

  useEffect(() => {
    fetchAudienceTypes();
  }, [fetchAudienceTypes]);

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    const audienceToDelete = data.find(type => type.id === selectedId);

    try {
      await api.delete(selectedId)
      showToast(t("common.success"), t("audienceTypes.audienceTypeDeleted") + " " + audienceToDelete?.name, "success");
      fetchAudienceTypes();
    } catch {
      showToast(t("common.error"), t("audienceTypes.failedToDelete") + " " + audienceToDelete?.name, "error");
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <Toaster ref={toasterRef} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("audienceTypes.title")}</h1>
          <p className="text-muted-foreground">{t("audienceTypes.description")}</p>
        </div>
        <Link href={`/${env}/emails/audience-type/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            {t("audienceTypes.addAudienceType")}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{type.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Link href={`/${env}/emails/audience-type/${type.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setSelectedId(type.id)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10">
                  {t("audienceTypes.noAudienceTypesFound")}
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
        title={t("audienceTypes.title")}
        description={t("audience.deleteConfirmation")}
      />
    </div>
  )
}
