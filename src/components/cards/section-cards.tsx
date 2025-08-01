"use client"

import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconMail,
  IconDatabase,
  IconTarget,
  IconTemplate,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AudienceApi } from "@/lib/api/audience"
import { SenderApi } from "@/lib/api/sender"
import { useEnvironment } from "@/lib/context/environment"
import { RippleWaveLoader } from "../ripple-wave-loader"
import { TemplateApi } from "@/lib/api/template"

interface MetricData {
  value: string
  change: number
  trend: 'up' | 'down'
  description: string
}

export function SectionCards() {
  const { env } = useEnvironment()

  const [loadingAudience, setLoadingAudience] = useState(true)
  const [loadingSender, setLoadingSender] = useState(true)
  const [loadingTemplate, setLoadingTemplate] = useState(true)

  const [metrics, setMetrics] = useState<{
    totalAudiences: MetricData
    activeAudiences: MetricData
    totalSenders: MetricData
    audienceTypes: MetricData
    totalTemplates: MetricData
  }>({
    totalAudiences: { value: "0", change: 0, trend: 'up', description: "Total audiences created" },
    activeAudiences: { value: "0", change: 0, trend: 'up', description: "Currently active audiences" },
    totalSenders: { value: "0", change: 0, trend: 'up', description: "Email senders configured" },
    audienceTypes: { value: "0", change: 0, trend: 'up', description: "Different audience categories" },
    totalTemplates: { value: "0", change: 0, trend: 'up', description: "Email templates available" }
  })

  useEffect(() => {
    let cancelled = false
    async function loadAudienceMetrics() {
      setLoadingAudience(true)
      console.log("Loading metrics for environment:", env)
      try {
        const apiAudience = new AudienceApi(env)
        const data = await apiAudience.count()
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalAudiences: {
            ...prev.totalAudiences,
            value: data.count.toLocaleString(),
            change: 12.5,
            trend: "up",
            description: "Growing audience base",
          },
        }))
      } catch (err) {
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalAudiences: {
            ...prev.totalAudiences,
            value: "0",
            description: "Error loading data",
            change: 0,
            trend: "down",
          },
        }))
      } finally {
        if (!cancelled) setLoadingAudience(false)
      }
    }
    loadAudienceMetrics()
    return () => { cancelled = true }
  }, [env])

  useEffect(() => {
    let cancelled = false
    async function loadSenderMetrics() {
      setLoadingSender(true)
      try {
        const apiSender = new SenderApi(env)
        const data = await apiSender.count()
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalSenders: {
            ...prev.totalSenders,
            value: data.count.toLocaleString(),
            change: 8.2,
            trend: "up",
            description: "Growing sender base",
          },
        }))
      } catch (err) {
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalSenders: {
            ...prev.totalSenders,
            value: "0",
            description: "Error loading data",
            change: 0,
            trend: "down",
          },
        }))
      } finally {
        if (!cancelled) setLoadingSender(false)
      }
    }
    loadSenderMetrics()
    return () => { cancelled = true }
  }, [env])

  useEffect(() => {
    let cancelled = false
    async function loadTemplateMetrics() {
      setLoadingTemplate(true)
      console.log("Loading metrics for environment:", env)
      try {
        const apiTemplate = new TemplateApi(env)
        const data = await apiTemplate.count()
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalTemplates: {
            ...prev.totalTemplates,
            value: data.count.toLocaleString(),
            change: 12.5,
            trend: "up",
            description: "Growing template base",
          },
        }))
      } catch (err) {
        if (cancelled) return
        setMetrics((prev) => ({
          ...prev,
          totalTemplates: {
            ...prev.totalTemplates,
            value: "0",
            description: "Error loading data",
            change: 0,
            trend: "down",
          },
        }))
      } finally {
        if (!cancelled) setLoadingTemplate(false)
      }
    }
    loadTemplateMetrics()
    return () => { cancelled = true }
  }, [env])

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      <Card className="@container/card min-h-[180px]">
        {loadingAudience ? (
          <div className="flex items-center justify-center h-full w-full max-h-[40px]">
            <RippleWaveLoader />
          </div>
        ) : (
          <>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <IconUsers className="size-4" />
                Total Audiences
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metrics.totalAudiences.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={metrics.totalAudiences.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {metrics.totalAudiences.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
                  {formatChange(metrics.totalAudiences.change)}
                </Badge>
              </CardAction>
            </CardHeader>
          </>
        )}
      </Card>

      <Card className="@container/card min-h-[180px]">
        {loadingSender ? (
          <div className="flex items-center justify-center h-full w-full max-h-[40px]">
            <RippleWaveLoader />
          </div>
        ) : (
          <>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <IconMail className="size-4" />
                Email Senders
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metrics.totalSenders.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={metrics.totalSenders.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {metrics.totalSenders.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
                  {formatChange(metrics.totalSenders.change)}
                </Badge>
              </CardAction>
            </CardHeader>
          </>
        )}
      </Card>

      <Card className="@container/card min-h-[180px]">
        {loadingTemplate ? (
          <div className="flex items-center justify-center h-full w-full max-h-[40px]">
            <RippleWaveLoader />
          </div>
        ) : (
          <>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <IconUsers className="size-4" />
                Total Templates
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metrics.totalTemplates.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={metrics.totalTemplates.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {metrics.totalTemplates.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
                  {formatChange(metrics.totalTemplates.change)}
                </Badge>
              </CardAction>
            </CardHeader>
          </>
        )}
      </Card>

      {/* Other cards remain static for now, but you can add loaders/fetches the same way */}
      <Card className="@container/card min-h-[180px]">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconDatabase className="size-4" />
            Audience Types
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.audienceTypes.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.audienceTypes.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.audienceTypes.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.audienceTypes.change)}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card min-h-[180px]">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconTemplate className="size-4" />
            Email Templates
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.totalTemplates.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.totalTemplates.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.totalTemplates.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.totalTemplates.change)}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
