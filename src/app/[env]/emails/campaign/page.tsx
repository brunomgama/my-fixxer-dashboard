"use client"

import Link from "next/link"
import { useEffect, useState, useCallback, useMemo } from "react"
import { IconPlus, IconMail, IconEdit, IconTrash, IconCopy } from "@tabler/icons-react"

import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { CampaignApi } from "@/lib/api/campaign"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { Badge } from "@/components/ui/badge"
import { Campaign } from "@/lib/types/campaign"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function CampaignPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const api = useMemo(() => new CampaignApi(env), [env])

  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      const result = await api.list({ limit: 50 })
      setData(result.results)
    } catch {
      setError(t("campaigns.failedToFetch"))
    } finally {
      setLoading(false)
    }
  }, [api, t])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      showToast(t("common.success"), t("campaigns.campaignDeleted"), "success")
      fetchCampaigns()
    } catch {
      showToast(t("common.error"), t("campaigns.failedToDelete"), "error")
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await api.duplicate(id)
      showToast(t("common.success"), t("campaigns.campaignDuplicated") + ` "${name}"`, "success")
      fetchCampaigns()
    } catch {
      showToast(t("common.error"), t("campaigns.failedToDuplicate"), "error")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {t("campaigns.sent")}
          </Badge>
        )
      case 'sending':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {t("campaigns.sending")}
          </Badge>
        )
      case 'planned':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            {t("campaigns.planned")}
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            {t("templates.draft")}
          </Badge>
        )
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {t("templates.archived")}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <Toaster ref={toasterRef} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("campaigns.title")}</h1>
          <p className="text-muted-foreground">{t("campaigns.description")}</p>
        </div>
        <Link href={`/${env}/emails/campaign/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            {t("campaigns.addCampaign")}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("audience.local")}</TableHead>
              <TableHead>{t("campaigns.subject")}</TableHead>
              <TableHead>{t("audience.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="flex items-center gap-2">
                    <IconMail className="h-4 w-4 text-muted-foreground shrink-0" />
                    {campaign.name}
                  </TableCell>

                  <TableCell>
                    <span>
                      {campaign.local === "FR" ? "🇫🇷 " : campaign.local === "NL" ? "🇳🇱 " : "🌍 "}
                    </span>
                    {campaign.local}
                  </TableCell>

                  <TableCell className="max-w-[200px] truncate">{campaign.subject}</TableCell>

                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    <Link href={`/${env}/emails/campaign/${campaign.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDuplicate(campaign.id, campaign.name)}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setSelectedId(campaign.id)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t("campaigns.noCampaignsFound")}
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
        title={t("campaigns.title")}
        description={t("audience.deleteConfirmation")}
      />
    </div>
  )
}