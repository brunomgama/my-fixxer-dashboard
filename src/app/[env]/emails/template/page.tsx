"use client"

import Link from "next/link"
import { useEffect, useState, useCallback, useMemo } from "react"
import { IconPlus, IconFile, IconEdit, IconTrash, IconCopy } from "@tabler/icons-react"

import { useEnvironment } from "@/lib/context/environment"
import { TemplateApi } from "@/lib/api/template"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { Badge } from "@/components/ui/badge"
import { Template } from "@/lib/types/template"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function TemplatePage() {
  const { env } = useEnvironment()
  const api = useMemo(() => new TemplateApi(env), [env])

  const { toasterRef, showToast } = useToast();

  const [data, setData] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      const result = await api.list({ limit: 50 })
      setData(result.results)
    } catch {
      setError("Failed to fetch templates")
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleConfirmDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await api.delete(selectedId)
      showToast("Success", "Template deleted", "success")
      fetchTemplates()
    } catch {
      showToast("Error", "Failed to delete template", "error")
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await api.duplicate(id)
      showToast("Success", `Template "${name}" duplicated`, "success")
      fetchTemplates()
    } catch {
      showToast("Error", "Failed to duplicate template", "error")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Published
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            Draft
          </Badge>
        )
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Archived
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
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-muted-foreground">Manage email templates</p>
        </div>
        <Link href={`/${env}/emails/template/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            Add Template
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
              data.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="flex items-center gap-2">
                    <IconFile className="h-4 w-4 text-muted-foreground shrink-0" />
                    {template.name}
                  </TableCell>

                  <TableCell>
                    <span>
                      {template.local === "FR" ? "🇫🇷 " : template.local === "NL" ? "🇳🇱 " : "🌍 "}
                    </span>
                    {template.local}
                  </TableCell>

                  <TableCell className="capitalize">{template.emailType}</TableCell>

                  <TableCell>
                    {getStatusBadge(template.status)}
                  </TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    <Link href={`/${env}/emails/template/${template.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDuplicate(template.id, template.name)}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setSelectedId(template.id)}>
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No templates found.
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