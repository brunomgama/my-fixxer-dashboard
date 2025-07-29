"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CreateAudienceTypePage() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { env } = useEnvironment()

  const api = new AudienceTypesApi(env)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    setIsSubmitting(true)
    try {
      await api.create({ name, user: "Bruno" })
      toast.success("Audience type created")
      router.back()
    } catch (err) {
      toast.error("Failed to create audience type")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (

    <div className="px-6 pt-8">
          <h1 className="text-2xl font-semibold">Create Audience Type</h1>
          <p className="text-muted-foreground">Add a new audience type category</p>
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="mb-2 mt-4">Name *</Label>
            <Input
              id="name"
              className="w-full"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
          </form>
        </div>
  )
}
