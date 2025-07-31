"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { useEnvironment } from "@/lib/context/environment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function CreateAudienceTypePage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const api = new AudienceTypesApi(env)
  const { toasterRef, showToast } = useToast();

  const [name, setName] = useState("")
  
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast("Error", "Name is required", "error");
      setError("Name is required")
      return
    }

    setIsSubmitting(true)
    try {
      await api.create({ name, user: "system" })
      showToast("Success", "Audience type created", "success");
      router.back()
    } catch (err) {
      showToast("Error", "Failed to create audience type", "error");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Create Audience Type</h1>
      <p className="text-muted-foreground">Add a new audience type category</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name" className={`mb-2 mt-4 ${error ? 'text-destructive' : ''}`}>
            Name *
          </Label>
          <Input id="name" className={`w-full ${error ? 'border-destructive' : ''}`} value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError("")
            }} />
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
