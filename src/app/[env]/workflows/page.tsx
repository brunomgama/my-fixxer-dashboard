"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { Workflow } from "@/lib/types/workflow"
import { WorkflowApi } from "@/lib/api/workflow"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldX } from "lucide-react"

export default function WorkflowPage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)

  // Use API class instead of hardcoded URL
  const api = useMemo(() => new WorkflowApi(env), [env])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.list({ limit: 50 })
        setWorkflows(data.results)
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch workflows")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [api])

  if (loading) return <RippleWaveLoader />

  return (
    <div className="space-y-6 mr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workflows</h1>
          <p className="text-muted-foreground">Manage and view all workflows</p>
        </div>
        <Link href={`/${env}/workflows/creation`}>
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {/* <TableHead>ARN</TableHead> */}
              <TableHead>Version</TableHead>
              <TableHead>Active</TableHead>
              {/* <TableHead>Created</TableHead> */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length > 0 ? (
              workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>{workflow.name}</TableCell>
                  {/* <TableCell className="max-w-[200px] truncate">{workflow.arn}</TableCell> */}
                  <TableCell>{workflow.version}</TableCell>
                  <TableCell>
                    {workflow.active ? (
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
                  {/* <TableCell>{new Date(workflow.createDate).toLocaleString()}</TableCell> */}
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No workflows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
