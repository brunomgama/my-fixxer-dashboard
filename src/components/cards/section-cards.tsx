"use client"

import { useEffect, useState } from "react"
import {Card,CardHeader, CardTitle,CardContent} from "@/components/ui/card"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { AudienceApi } from "@/lib/api/audience"
import { SenderApi } from "@/lib/api/sender"
import { TemplateApi } from "@/lib/api/template"
import { CampaignApi } from "@/lib/api/campaign"
import { UnsubscribeApi } from "@/lib/api/unsubscribe"
import { ScheduleApi } from "@/lib/api/schedule"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import {UsersRound,TicketsPlane,File,Mail,UserMinus,Clock} from "lucide-react"
import Link from "next/link"

interface MetricData {
  value: string
  change: number
  trend: "up" | "down"
  description: string
}

export function SectionCards() {
  const { env } = useEnvironment()
  const { t } = useTranslation()

  const [loadingAudience, setLoadingAudience] = useState(true)
  const [loadingSender, setLoadingSender] = useState(true)
  const [loadingTemplate, setLoadingTemplate] = useState(true)
  const [loadingCampaign, setLoadingCampaign] = useState(true)
  const [loadingUnsubscribes, setLoadingUnsubscribes] = useState(true)
  const [loadingScheduler, setLoadingScheduler] = useState(true)

  const [metrics, setMetrics] = useState<{
    totalAudiences: MetricData
    totalSenders: MetricData
    totalTemplates: MetricData
    totalCampaigns: MetricData
    totalUnsubscribes: MetricData
    totalSchedules: MetricData
    totalActiveSchedules: MetricData
  }>({
    totalAudiences: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalAudiences",
    },
    totalSenders: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalSenders",
    },
    totalTemplates: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalTemplates",
    },
    totalCampaigns: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalCampaigns",
    },
    totalUnsubscribes: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalUnsubscribes",
    },
    totalSchedules: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalSchedules",
    },
    totalActiveSchedules: {
      value: "0",
      change: 0,
      trend: "up",
      description: "infoSectionCards.totalActiveSchedules",
    },
  })

  // Audience
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingAudience(true)
      try {
        const data = await new AudienceApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalAudiences: {
            ...p.totalAudiences,
            value: data.count.toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingAudience(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  // Sender
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingSender(true)
      try {
        const data = await new SenderApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalSenders: {
            ...p.totalSenders,
            value: data.count.toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingSender(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  // Template
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingTemplate(true)
      try {
        const data = await new TemplateApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalTemplates: {
            ...p.totalTemplates,
            value: data.count.toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingTemplate(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  // Campaign
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingCampaign(true)
      try {
        const data = await new CampaignApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalCampaigns: {
            ...p.totalCampaigns,
            value: data.count.toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingCampaign(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  // Unsubscribes
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingUnsubscribes(true)
      try {
        const data = await new UnsubscribeApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalUnsubscribes: {
            ...p.totalUnsubscribes,
            value: Math.round(data.count/2).toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingUnsubscribes(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  // Scheduler
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingScheduler(true)
      try {
        const data = await new ScheduleApi(env).count()
        if (cancelled) return
        setMetrics((p) => ({
          ...p,
          totalSchedules: {
            ...p.totalSchedules,
            value: data.count.toLocaleString(),
          },
          totalActiveSchedules: {
            ...p.totalActiveSchedules,
            value: data.active.toLocaleString(),
          },
        }))
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) setLoadingScheduler(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [env])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {[
        {
          key: "audience",
          loading: loadingAudience,
          icon: <UsersRound className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalAudiences"),
          value: metrics.totalAudiences.value,
          desc: t(metrics.totalAudiences.description),
          href: `/${env}/emails/audience`,
        },
        {
          key: "sender",
          loading: loadingSender,
          icon: <TicketsPlane className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalSenders"),
          value: metrics.totalSenders.value,
          desc: t(metrics.totalSenders.description),
          href: `/${env}/emails/sender`,
        },
        {
          key: "template",
          loading: loadingTemplate,
          icon: <File className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalTemplates"),
          value: metrics.totalTemplates.value,
          desc: t(metrics.totalTemplates.description),
          href: `/${env}/emails/template`,
        },
        {
          key: "campaign",
          loading: loadingCampaign,
          icon: <Mail className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalCampaigns"),
          value: metrics.totalCampaigns.value,
          desc: t(metrics.totalCampaigns.description),
          href: `/${env}/emails/campaign`,
        },
        {
          key: "unsubscribe",
          loading: loadingUnsubscribes,
          icon: <UserMinus className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalUnsubscribes"),
          value: metrics.totalUnsubscribes.value,
          desc: t(metrics.totalUnsubscribes.description),
          href: `/${env}/emails/unsubscribe`,
        },
        {
          key: "schedule",
          loading: loadingScheduler,
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
          title: t("infoSectionCards.totalSchedules"),
          active: metrics.totalActiveSchedules.value,
          value: metrics.totalSchedules.value,
          desc: t(metrics.totalSchedules.description),
          href: `/${env}/emails/schedule`,
        },
      ].map(({ key, href, loading, icon, title, value, desc }) => (
        <Link key={key} href={href} className="focus:outline-none">
          <Card className="cursor-pointer transition-shadow hover:shadow-md hover:bg-black hover:text-white">
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <RippleWaveLoader />
              </div>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  {icon}
                </CardHeader>
                <CardContent>
                  {key === "schedule" ? (
                    <div className="text-2xl font-bold">
                      {metrics.totalActiveSchedules.value}/{metrics.totalSchedules.value}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">{value}</div>
                  )}
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
}