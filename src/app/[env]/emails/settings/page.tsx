"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { useToast } from "@/hooks/useToast"
import { SettingsApi } from "@/lib/api/settings"
import { Setting, SETTINGS_CONFIG, SettingConfig } from "@/lib/types/settings"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, RefreshCw, AlertCircle, RotateCw } from "lucide-react"

export default function SettingsPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const { showToast } = useToast()

  // UI state
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState<Record<string, string>>({})
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initializing, setInitializing] = useState(false)

  // Build API once per env
  const api = useMemo(() => new SettingsApi(env), [env])

  // Guard: fetch once per mount
  const fetchedOnce = useRef(false)
  const lastEnv = useRef<string>(env)

  // Helpers
  const toMap = (arr: Setting[]) =>
    (arr || []).reduce<Record<string, string>>((acc, s) => {
      acc[s.id] = s.value
      return acc
    }, {})

  const fillWithDefaults = (partial: Record<string, string>) => {
    const all: Record<string, string> = {}
    SETTINGS_CONFIG.forEach(cfg => {
      all[cfg.id] = partial[cfg.id] ?? cfg.defaultValue
    })
    return all
  }

  const tt = (key: string, params?: Record<string, string | number>) =>
    (t as unknown as (k: string, p?: any) => string)(key, params)

  const load = async () => {
    setLoading(true)
    let aborted = false
    try {
      const res = await api.list()
      if (aborted) return
      const map = toMap(res.results)
      setPresentIds(new Set((res.results || []).map(s => s.id)))
      const complete = fillWithDefaults(map)
      setBaseline(complete)
      setFormData(complete)
    } catch (e) {
      if (!aborted) {
        console.error("Failed to fetch settings", e)
        showToast(t("common.error"), t("settings.failedToLoad"), "error")
        const defaults = fillWithDefaults({})
        setPresentIds(new Set())
        setBaseline(defaults)
        setFormData(defaults)
      }
    } finally {
      if (!aborted) setLoading(false)
    }
    return () => {
      aborted = true
    }
  }

  useEffect(() => {
    const envChanged = lastEnv.current !== env
    
    if (fetchedOnce.current && !envChanged) return
    
    fetchedOnce.current = true
    lastEnv.current = env
    
    if (envChanged) {
      setFormData({})
      setBaseline({})
      setPresentIds(new Set())
      setErrors({})
      setSavingId(null)
    }
    
    let cleanup: any
    ;(async () => {
      cleanup = await load()
    })()
    return () => {
      if (cleanup) cleanup()
    }
  }, [api, env])

  const validate = (cfg: SettingConfig, raw: string): string | null => {
    const value = raw?.toString().trim()
    if (!value) return t("settings.valueRequired")
    if (cfg.type === "number") {
      const num = Number(value)
      if (Number.isNaN(num)) return t("settings.valueMustBeNumber")
      if (cfg.min !== undefined && num < cfg.min) {
        return tt("settings.valueMustBeAtLeast", { min: cfg.min })
      }
      if (cfg.max !== undefined && num > cfg.max) {
        return tt("settings.valueMustBeAtMost", { max: cfg.max })
      }
    }
    return null
  }

  const hasChanged = (id: string) => formData[id] !== baseline[id]

  const onChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }))
  }

  const onRefresh = () => {
    fetchedOnce.current = false
    lastEnv.current = env
    load()
  }

  const onResetOne = (cfg: SettingConfig) => {
    setFormData(prev => ({ ...prev, [cfg.id]: cfg.defaultValue }))
    setErrors(prev => ({ ...prev, [cfg.id]: "" }))
  }

  const onSaveOne = async (cfg: SettingConfig) => {
    const value = formData[cfg.id]
    const err = validate(cfg, value)
    if (err) {
      setErrors(prev => ({ ...prev, [cfg.id]: err }))
      return
    }
    setSavingId(cfg.id)
    try {
      await api.update(cfg.id, { value: value.toString().trim() })
      setBaseline(prev => ({ ...prev, [cfg.id]: value.toString().trim() }))
      setPresentIds(prev => new Set(prev).add(cfg.id))
      showToast(t("common.success"), `${t("settings.settingUpdated")} ${t(`settings.${cfg.id}.label`)}`, "success")
    } catch (e) {
      console.error("Failed to update setting", e)
      showToast(t("common.error"), t("settings.failedToUpdate", { setting: t(`settings.${cfg.id}.label`) }), "error")
    } finally {
      setSavingId(null)
    }
  }

  const onInitializeDefaults = async () => {
    setInitializing(true)
    const missingSettings = SETTINGS_CONFIG.filter(cfg => !presentIds.has(cfg.id))
    
    if (missingSettings.length === 0) {
      showToast(t("common.info"), t("settings.allSettingsExist"), "info")
      setInitializing(false)
      return
    }

    let successCount = 0
    let failCount = 0

    for (const cfg of missingSettings) {
      try {
        await api.create({ id: cfg.id, value: cfg.defaultValue })
        setPresentIds(prev => new Set(prev).add(cfg.id))
        setBaseline(prev => ({ ...prev, [cfg.id]: cfg.defaultValue }))
        successCount++
      } catch (e) {
        console.error(`Failed to initialize setting ${cfg.id}`, e)
        failCount++
      }
    }

    if (successCount > 0) {
      showToast(
        t("common.success"), 
        tt("settings.initializedSettings", { count: successCount }), 
        "success"
      )
    }
    
    if (failCount > 0) {
      showToast(
        t("common.error"), 
        tt("settings.failedToInitialize", { count: failCount }), 
        "error"
      )
    }

    setInitializing(false)
  }

  // UI
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-8 w-56"><Skeleton className="h-8 w-56" /></div>
          <div className="mt-2 h-5 w-96"><Skeleton className="h-5 w-96" /></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="mt-2 h-4 w-80" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("settings.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onInitializeDefaults}
            disabled={initializing}
          >
            {initializing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
            {t("settings.initializeDefaults")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SETTINGS_CONFIG.map((cfg) => {
          const current = formData[cfg.id] ?? cfg.defaultValue
          const saved = baseline[cfg.id] ?? cfg.defaultValue
          const changed = hasChanged(cfg.id)
          const isDefaultFromDb = !presentIds.has(cfg.id)
          const hasError = Boolean(errors[cfg.id])
          const isSaving = savingId === cfg.id
          const isTimeLike = cfg.unit === "minutes"

          return (
            <Card key={cfg.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {t(`settings.${cfg.id}.label`)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          presentIds.has(cfg.id) 
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {presentIds.has(cfg.id) ? "Existent" : "Default"}
                      </Badge>
                      {changed && (
                        <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
                          {t("settings.modified")}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="min-h-[2.5rem] flex items-start">
                      {t(`settings.${cfg.id}.description`)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={cfg.id}>
                    {t("settings.value")} {cfg.unit && `(${t(`settings.units.${cfg.unit}`)})`}
                  </Label>
                  <Input
                    id={cfg.id}
                    type={cfg.type === "number" ? "number" : "text"}
                    value={current}
                    onChange={(e) => onChange(cfg.id, e.target.value)}
                    className={hasError ? "border-red-500" : ""}
                    min={cfg.type === "number" ? cfg.min : undefined}
                    max={cfg.type === "number" ? cfg.max : undefined}
                    step={
                      cfg.type === "number"
                        ? (cfg.max !== undefined && cfg.max <= 1 ? "0.01" : "1")
                        : undefined
                    }
                  />
                  {hasError && <p className="text-sm text-red-500">{errors[cfg.id]}</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResetOne(cfg)}
                    disabled={current === cfg.defaultValue || isSaving}
                  >
                    {t("settings.reset")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSaveOne(cfg)}
                    disabled={!changed || hasError || isSaving}
                  >
                    {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t("common.save")}
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="text-xs text-muted-foreground">
                  <strong>{t("settings.default")}:</strong> {cfg.defaultValue} {cfg.unit && t(`settings.units.${cfg.unit}`)}
                  {cfg.min !== undefined && <span> • <strong>{t("settings.min")}:</strong> {cfg.min}</span>}
                  {cfg.max !== undefined && <span> • <strong>{t("settings.max")}:</strong> {cfg.max}</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Alert className="mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>{t("settings.important")}:</strong> {t("settings.importantMessage")}
        </AlertDescription>
      </Alert>
    </div>
  )
}
