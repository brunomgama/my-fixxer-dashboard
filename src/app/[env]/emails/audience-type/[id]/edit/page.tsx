"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"

export default function EditAudienceTypePage() {
  const { id } = useParams()
  const router = useRouter()
  const { env } = useEnvironment()
  const api = new AudienceTypesApi(env)

  const [formData, setFormData] = React.useState({ name: "" })
  const [errors, setErrors] = React.useState<{ name?: string }>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasFetched, setHasFetched] = React.useState(false)

  React.useEffect(() => {
    const fetchAudienceType = async () => {
      try {
        const data = await api.getOne(id as string)
        setFormData({ name: data.name })
        setHasFetched(true)
      } catch (error) {
        toast.error("Failed to load audience type")
        router.back()
      } finally {
        setIsLoading(false)
      }
    }

    if (id && !hasFetched) {
      fetchAudienceType()
    }
  }, [id, api, router, hasFetched])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await api.update(id as string, {
        name: formData.name.trim(),
        user: "Bruno",
      })
      toast.success("Audience type updated")
      router.back()
    } catch (error) {
      toast.error("Failed to update audience type")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="p-6 text-muted-foreground">Loading...</p>
  }

  return (
    <div className="px-6 pt-8">
      <h1 className="text-2xl font-semibold">Edit Audience Type</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="w-full">
          <Label htmlFor="name" className="mb-2 mt-4">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </div>
  )
}
