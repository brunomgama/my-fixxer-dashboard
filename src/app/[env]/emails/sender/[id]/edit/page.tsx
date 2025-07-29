"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function EditSenderPage() {
  const { id } = useParams()
  const [email, setEmail] = useState("")
  const [alias, setAlias] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [emailType, setEmailType] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { env } = useEnvironment()
  const api = useMemo(() => new SenderApi(env), [env])

  useEffect(() => {
    const fetchSender = async () => {
      try {
        const sender = await api.getOne(id as string)
        setEmail(sender.email)
        setAlias(sender.alias)
        setEmailType(sender.emailType)
        setActive(sender.active)
      } catch {
        toast.error("Failed to load sender")
        router.back()
      }
    }
    fetchSender()
  }, [api, id, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = "Email is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await api.update(id as string, { email, alias, emailType, active, user: "Bruno" })
      toast.success("Sender updated")
      router.push(`/${env}/emails/sender`)
    } catch {
      toast.error("Failed to update sender")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sender@email.com"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        {/* Alias List */}
        <div>
          <Label className="mb-2 mt-4">Alias</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add alias"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAlias.trim()) {
                  e.preventDefault()
                  setAlias((prev) => [...prev, newAlias.trim()])
                  setNewAlias("")
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (newAlias.trim()) {
                  setAlias((prev) => [...prev, newAlias.trim()])
                  setNewAlias("")
                }
              }}
            >
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
                    onClick={() => setAlias((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Email Type Buttons */}
        <div>
          <Label className="mb-2 mt-4">Email Type *</Label>
          <div className="flex flex-wrap gap-2">
            {["campaign", "automation", "functional"].map((type) => (
              <Button
                key={type}
                type="button"
                variant={emailType.includes(type) ? "default" : "outline"}
                onClick={() => {
                  setEmailType((prev) =>
                    prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                  )
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-3 mt-4">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Active</Label>
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
