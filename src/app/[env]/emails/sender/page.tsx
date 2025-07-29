"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Sender } from "@/lib/types/sender"
import { toast } from "sonner"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { IconEdit, IconPlus, IconTrash, IconUser } from "@tabler/icons-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import Link from "next/link"

export default function SenderPage() {
  const { env } = useEnvironment()
  const api = useMemo(() => new SenderApi(env), [env])

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
      setError("Failed to fetch senders")
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchSender()
  }, [fetchSender])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      toast.success("Sender deleted")
      fetchSender()
    } catch {
      toast.error("Failed to delete sender")
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Senders</h1>
          <p className="text-muted-foreground">Manage existing senders</p>
        </div>
        <Link href={`/${env}/emails/sender/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            Add Sender
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Email Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      : <span className="text-muted-foreground italic">None</span>}
                  </TableCell>
                  <TableCell>
                    {sender.emailType?.length > 0
                      ? sender.emailType.join(", ")
                      : <span className="text-muted-foreground italic">None</span>}
                  </TableCell>
                  <TableCell>{sender.active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${env}/emails/sender/${sender.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setSelectedId(sender.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No sender found.
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
      />
    </div>
  )
}
