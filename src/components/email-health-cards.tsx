"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Mail, MailX, Shield, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailStatusApi, EmailStatusResponse, HealthStatus } from "@/lib/api/email-status"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { emailHealthCache } from "@/lib/cache/email-health-cache"

interface EmailHealthCardsProps {
  selectedDays: number
  forceRefresh?: boolean
  onRefreshComplete?: () => void
}

export function EmailHealthCards({ selectedDays, forceRefresh = false, onRefreshComplete }: EmailHealthCardsProps) {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const [data, setData] = useState<EmailStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchEmailStatus() {
      setLoading(true)
      setError(null)
      
      try {
        // Check cache first unless force refresh is requested
        if (!forceRefresh) {
          const cachedData = emailHealthCache.getHealthData(env, selectedDays)
          if (cachedData) {
            if (cancelled) return
            setData(cachedData)
            setLoading(false)
            return
          }
        }

        // Fetch fresh data
        const api = new EmailStatusApi(env)
        const result = await api.getStatus({
          category: 'global',
          days: selectedDays,
          percent: true
        })
        
        if (cancelled) return
        
        // Cache the result
        emailHealthCache.setHealthData(env, selectedDays, result)
        setData(result)
        
        // Notify parent that refresh is complete
        onRefreshComplete?.()
      } catch (err: any) {
        if (cancelled) return
        console.error('Failed to fetch email status:', err)
        setError(err.message || 'Failed to fetch email health data')
        onRefreshComplete?.()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEmailStatus()
    return () => { cancelled = true }
  }, [env, selectedDays, forceRefresh, onRefreshComplete])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-center h-16">
              <RippleWaveLoader />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{t('email_health.errors.loading_failed').replace('{error}', error)}</span>
        </div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          {t('email_health.errors.no_data')}
        </div>
      </Card>
    )
  }

  const api = new EmailStatusApi(env)
  const bounceHealth = api.getHealthStatus(data.console_bounce_rate, 'bounce')
  const complaintHealth = api.getHealthStatus(data.console_complaint_rate, 'complaint')
  const overallHealth = api.getOverallHealthStatus(data.console_bounce_rate, data.console_complaint_rate)

  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'danger': return 'text-red-600 bg-red-100'
    }
  }

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'danger': return <XCircle className="h-4 w-4" />
    }
  }

  const getBigHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'warning': return <AlertTriangle className="h-12 w-12 text-yellow-600" />
      case 'danger': return <XCircle className="h-12 w-12 text-red-600" />
      default: return null
    }
  }

  const getHealthLabel = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return t('email_health.status.healthy')
      case 'warning': return t('email_health.status.warning')
      case 'danger': return t('email_health.status.at_risk')
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number | string) => {
    if (typeof num === 'string') return num
    return `${(num * 100).toFixed(2)}%`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Sent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.total_sent')}</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.sent)}</div>
          <p className="text-xs text-muted-foreground">
            {t('email_health.time_periods.last_days').replace('{days}', String(selectedDays))}
          </p>
        </CardContent>
      </Card>

      {/* Total Bounces */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.total_bounces')}</CardTitle>
          <MailX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.bounces)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.bounce_rate)} {t('email_health.time_periods.of_sent')}
          </p>
        </CardContent>
      </Card>

      {/* Total Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.total_complaints')}</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.complaints)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.complaint_rate)} {t('email_health.time_periods.of_sent')}
          </p>
        </CardContent>
      </Card>

      {/* Bounce Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.bounce_rate')}</CardTitle>
          <Badge variant="outline" className={getHealthColor(bounceHealth)}>
            {getHealthIcon(bounceHealth)}
            <span className="ml-1">{getHealthLabel(bounceHealth)}</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(data.console_bounce_rate)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('email_health.thresholds.bounce_warning')}
          </p>
        </CardContent>
      </Card>

      {/* Complaint Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.complaint_rate')}</CardTitle>
          <Badge variant="outline" className={getHealthColor(complaintHealth)}>
            {getHealthIcon(complaintHealth)}
            <span className="ml-1">{getHealthLabel(complaintHealth)}</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(data.console_complaint_rate)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('email_health.thresholds.complaint_warning')}
          </p>
        </CardContent>
      </Card>

      {/* Overall Health Status */}
      <Card className={getHealthColor(overallHealth)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('email_health.cards.health_status')}</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center">
            <span>
              {getBigHealthIcon(overallHealth)}
            </span>
            <span className="text-lg font-bold">
              {getHealthLabel(overallHealth)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}