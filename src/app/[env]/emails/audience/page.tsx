"use client"

import Link from "next/link"
import { useEffect, useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { IconPlus, IconUser, IconEdit, IconTrash } from "@tabler/icons-react"

import { useEnvironment } from "@/lib/context/environment"
import { AudienceApi } from "@/lib/api/audience"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { ShieldCheck, ShieldX } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Audience {
  id: string
  name: string
  local: string
  definition?: string
  audienceTypeId: string
  emailType: string
  sql: string
  countRecipients: number
  active: boolean
}

export default function AudiencePage() {
  const { env } = useEnvironment()
  const api = useMemo(() => new AudienceApi(env), [env]);

  const [data, setData] = useState<Audience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchAudiences = useCallback(async () => {
    try {
      const result = await api.list({ limit: 50 });
      setData(result.results)
    } catch {
      setError("Failed to fetch audiences")
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchAudiences()
  }, [fetchAudiences])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      toast.success("Audience type deleted")
      fetchAudiences()
    } catch {
      toast.error("Failed to delete audience type")
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
        user: "Bruno",
      }
  
      await api.update(id, updatedAudience)
  
      toast.success("Audience deactivated")
      fetchAudiences()
    } catch (err) {
      toast.error("Failed to deactivate audience")
    }
  }

  if (loading) return <RippleWaveLoader />

  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audiences</h1>
          <p className="text-muted-foreground">Manage audiences</p>
        </div>
        <Link href={`/${env}/emails/audience/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            Add Audience
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Email Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        <ShieldX className="w-3.5 h-3.5 mr-1" />
                        Inactive
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
                      {audience.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No audiences found.
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
