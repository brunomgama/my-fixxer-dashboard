"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Mail, MailX, Shield, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailStatusApi, EmailStatusResponse, HealthStatus } from "@/lib/api/email-status"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"

interface EmailHealthCardsProps {
  selectedDays: number
}

export function EmailHealthCards({ selectedDays }: EmailHealthCardsProps) {
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
        const api = new EmailStatusApi(env)
        const result = await api.getStatus({
          category: 'global',
          days: selectedDays,
          percent: true
        })
        
        if (cancelled) return
        setData(result)
      } catch (err: any) {
        if (cancelled) return
        console.error('Failed to fetch email status:', err)
        setError(err.message || 'Failed to fetch email health data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEmailStatus()
    return () => { cancelled = true }
  }, [env, selectedDays])

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
          <span>Error loading email health data: {error}</span>
        </div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No email health data available
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
      case 'healthy': return 'Healthy'
      case 'warning': return 'Warning'
      case 'danger': return 'At Risk'
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
          <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.sent)}</div>
          <p className="text-xs text-muted-foreground">
            Last {selectedDays} days
          </p>
        </CardContent>
      </Card>

      {/* Total Bounces */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bounces</CardTitle>
          <MailX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.bounces)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.bounce_rate)} of sent
          </p>
        </CardContent>
      </Card>

      {/* Total Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.complaints)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.complaint_rate)} of sent
          </p>
        </CardContent>
      </Card>

      {/* Bounce Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
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
            Warning at 5%, Risk at 10%
          </p>
        </CardContent>
      </Card>

      {/* Complaint Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Complaint Rate</CardTitle>
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
            Warning at 0.1%, Risk at 0.5%
          </p>
        </CardContent>
      </Card>

      {/* Overall Health Status */}
      <Card className={getHealthColor(overallHealth)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Status</CardTitle>
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