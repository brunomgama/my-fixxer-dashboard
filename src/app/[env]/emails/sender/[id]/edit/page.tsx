"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"

export default function EditSenderPage() {
  const { id } = useParams()
  const { env } = useEnvironment()
  const router = useRouter()
  const api = useMemo(() => new SenderApi(env), [env])
  const { toasterRef, showToast } = useToast()

  const [email, setEmail] = useState("")
  const [alias, setAlias] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [emailType, setEmailType] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSender = async () => {
      try {
        const sender = await api.getOne(id as string)
        setEmail(sender.email)
        setAlias(sender.alias)
        setEmailType(sender.emailType)
        setActive(sender.active)
      } catch {
        showToast("Error", "Failed to load sender", "error")
        router.back()
      } finally {
        setLoading(false)
      }
    }
    fetchSender()
  }, [api, id, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) newErrors.email = "Email is required"
    if (alias.length === 0) newErrors.alias = "At least one alias is required"
    if (emailType.length === 0) newErrors.emailType = "At least one email type is required"

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0]
      const firstMessage = newErrors[firstField]
      showToast("Validation Error", firstMessage, "error")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await api.update(id as string, { email, alias, emailType, active, user: "system" })
      showToast("Success", "Sender updated successfully", "success")
      router.push(`/${env}/emails/sender`)
    } catch {
      showToast("Error", "Failed to update sender", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <RippleWaveLoader />

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Edit Sender</h1>
      <p className="text-muted-foreground">Update existing sender</p>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <Label htmlFor="email" className="mb-2 mt-4">Email *</Label>
          <Textarea
            id="email"
            className="w-full"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
            }}
            placeholder="sender@email.com"
          />
        </div>

        {/* Alias */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.alias ? 'text-destructive' : ''}`}>
            Alias *
          </Label>
          <div className="flex gap-2">
            <Input
              className={`w-full ${errors.alias ? 'border-destructive' : ''}`}
              placeholder="Add alias"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAlias.trim()) {
                  e.preventDefault()
                  setAlias((prev) => {
                    const updated = [...prev, newAlias.trim()]
                    if (updated.length > 0 && errors.alias) {
                      setErrors((prev) => ({ ...prev, alias: "" }))
                    }
                    return updated
                  })
                  setNewAlias("")
                }
              }}
            />
            <Button type="button"
              onClick={() => {
                if (newAlias.trim()) {
                  setAlias((prev) => {
                    const updated = [...prev, newAlias.trim()]
                    if (updated.length > 0 && errors.alias) {
                      setErrors((prev) => ({ ...prev, alias: "" }))
                    }
                    return updated
                  })
                  setNewAlias("")
                }
              }}>
              Add
            </Button>
          </div>

          {alias.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {alias.map((a, idx) => (
                <li key={idx} className="flex justify-between items-center border px-2 py-1 rounded">
                  {a}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAlias((prev) => {
                        const updated = prev.filter((_, i) => i !== idx)
                        if (updated.length === 0) {
                          setErrors((prev) => ({ ...prev, alias: "At least one alias is required" }))
                        }
                        return updated
                      })
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Email Type */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.emailType ? "text-destructive" : ""}`}>
            Email Type *
          </Label>
          <div className="flex flex-wrap gap-2">
            {["campaign", "automation", "functional"].map((type) => (
              <Button
                key={type}
                type="button"
                variant={emailType.includes(type) ? "default" : "outline"}
                onClick={() => {
                  setEmailType((prev) => {
                    const updated = prev.includes(type)
                      ? prev.filter((t) => t !== type)
                      : [...prev, type]
                    if (updated.length > 0 && errors.emailType) {
                      setErrors((prev) => ({ ...prev, emailType: "" }))
                    }
                    return updated
                  })
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
