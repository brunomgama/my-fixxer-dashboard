"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Toaster from "@/components/toast"
import { useToast } from "@/hooks/useToast"

export default function CreateSenderPage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const api = useMemo(() => new SenderApi(env), [env])
  const { toasterRef, showToast } = useToast();

  const [email, setEmail] = useState("")
  const [alias, setAlias] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [emailType, setEmailType] = useState<string[]>([])
  const [active, setActive] = useState(true)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
  
    if (!email.trim()) newErrors.email = "Email is required"
    if (alias.length === 0) newErrors.alias = "At least one alias is required"
    if (emailType.length === 0) newErrors.emailType = "At least one email type is required"
  
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await api.create({ email, alias, emailType, active, user: "Bruno" })
      showToast("Success", "Sender created successfully", "success")
      router.push(`/${env}/emails/sender`)
    } catch (err) {
      showToast("Error", "Failed to create sender", "error")
      console.error("Failed to create sender:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-8">
      <Toaster ref={toasterRef} />
      <h1 className="text-2xl font-semibold">Create Sender</h1>
      <p className="text-muted-foreground">Add a new sender</p>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div className="w-full">
          <Label htmlFor="email" className={`mb-2 mt-4 ${errors.email ? 'text-destructive' : ''}`}>
            Email *
          </Label>
          <Input id="email"
            className={`w-full ${errors.email ? 'border-destructive' : ''}`} value={email} placeholder="sender@email.com"
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
            }}
          />
        </div>

        {/* Alias List */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.alias ? 'text-destructive' : ''}`}>
            Alias
          </Label>
          <div className="flex gap-2">
            <Input className={`w-full ${errors.alias ? 'border-destructive' : ''}`}
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
            <Button type="button"
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
                  <Button variant="ghost" size="sm" onClick={() => setAlias((prev) => prev.filter((_, i) => i !== idx))}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Email Type List */}
        <div>
          <Label className={`mb-2 mt-4 ${errors.emailType ? 'text-destructive' : ''}`}>
            Email Type *
          </Label>
          <div className="flex flex-wrap gap-2">
            {["campaign", "automation", "functional"].map((type) => (
              <Button key={type} type="button" variant={emailType.includes(type) ? "default" : "outline"}
                onClick={() => {
                  setEmailType((prev) =>
                    prev.includes(type)
                      ? prev.filter((t) => t !== type)
                      : [...prev, type]
                  )
                  if (errors.emailType) setErrors((prev) => ({ ...prev, emailType: "" }))
                }} >
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
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  )
}
