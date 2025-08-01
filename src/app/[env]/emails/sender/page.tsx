"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { Button } from "@/components/ui/button"
import { Sender } from "@/lib/types/sender"

import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { IconEdit, IconPlus, IconTrash, IconUser } from "@tabler/icons-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldX } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function SenderPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const api = useMemo(() => new SenderApi(env), [env])

  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSender = useCallback(async () => {
    try {
      const result = await api.list({ limit: 50 })
      setData(result.results)
    } catch {
      setError(t("senders.failedToLoad"))
    } finally {
      setLoading(false)
    }
  }, [api, t])

  useEffect(() => {
    fetchSender()
  }, [fetchSender])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      showToast(t("common.success"), t("senders.senderDeleted"), "success");
      fetchSender()
    } catch {
      showToast(t("common.error"), t("senders.failedToDelete"), "error");
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (sender: Sender) => {
    try {
      const updatedSender = { ...sender, active: !sender.active, user: "system" }
  
      await api.update(sender.id, updatedSender)
      showToast(t("common.success"), updatedSender.active ? t("senders.senderActivated") : t("senders.senderDeactivated"), "success");
      fetchSender()
    } catch {
      showToast(t("common.error"), t("senders.failedToUpdateStatus"), "error");
    }
  }
  
  const getEmailTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "functional":
        return "bg-purple-100 text-purple-700"
      case "automation":
        return "bg-blue-100 text-blue-700"
      case "campaign":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }
  
  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <Toaster ref={toasterRef} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("senders.title")}</h1>
          <p className="text-muted-foreground">{t("senders.description")}</p>
        </div>
        <Link href={`/${env}/emails/sender/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            {t("senders.addSender")}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("senders.alias")}</TableHead>
              <TableHead>{t("senders.emailTypes")}</TableHead>
              <TableHead>{t("common.active")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((sender) => (
                <TableRow key={sender.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{sender.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sender.alias?.length > 0
                      ? sender.alias.join(", ")
                      : <span className="text-muted-foreground italic">{t("senders.none")}</span>}
                  </TableCell>
                  <TableCell>
                    {sender.emailType?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {sender.emailType.map((type: string) => (
                          <Badge
                            key={type}
                            className={getEmailTypeBadgeStyle(type)}
                          >
                            {t(`senders.${type}`)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">{t("senders.none")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sender.active ? (
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
                    <Link href={`/${env}/emails/sender/${sender.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setSelectedId(sender.id)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(sender)}
                    >
                      {sender.active ? t("audience.deactivate") : t("audience.activate")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t("senders.noSendersFound")}
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
        title={t("common.delete")}
        description={t("audience.deleteConfirmation")}
      />
    </div>
  )
}
