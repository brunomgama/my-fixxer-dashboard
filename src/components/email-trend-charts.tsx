"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts"
import { format, parseISO } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailStatusApi, EmailStatusResponse, EmailStatusTrendItem, EMAIL_HEALTH_THRESHOLDS } from "@/lib/api/email-status"
import { useEnvironment } from "@/lib/context/environment"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { emailHealthCache } from "@/lib/cache/email-health-cache"

interface EmailTrendChartsProps {
  selectedDays: number
  trendDays: number
  forceRefresh?: boolean
  onRefreshComplete?: () => void
}

export function EmailTrendCharts({ selectedDays, trendDays, forceRefresh = false, onRefreshComplete }: EmailTrendChartsProps) {
  const { env } = useEnvironment()
  const [data, setData] = useState<EmailStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchEmailTrends() {
      setLoading(true)
      setError(null)
      
      try {
        // Check cache first unless force refresh is requested
        if (!forceRefresh) {
          const cachedData = emailHealthCache.getTrendData(env, selectedDays, trendDays)
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
          trends: true,
          trend_days: trendDays,
          percent: true
        })
        
        if (cancelled) return
        
        // Cache the result
        emailHealthCache.setTrendData(env, selectedDays, trendDays, result)
        setData(result)
        
        // Notify parent that refresh is complete
        onRefreshComplete?.()
      } catch (err: any) {
        if (cancelled) return
        console.error('Failed to fetch email trends:', err)
        setError(err.message || 'Failed to fetch trend data')
        onRefreshComplete?.()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEmailTrends()
    return () => { cancelled = true }
  }, [env, selectedDays, trendDays, forceRefresh, onRefreshComplete])

  const formatTrendData = (trends?: EmailStatusTrendItem[]) => {
    if (!trends) return []
    return trends.map(item => {
      // always coerce to string so .replace is safe
      const rate = parseFloat(
        String(item.averageRate).replace('%', '')
      )
      return {
        date: format(parseISO(item.date), 'MMM dd'),
        fullDate: item.date,
        rate,
      }
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              Rate: {entry.value.toFixed(3)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bounce Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <RippleWaveLoader />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Complaint Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <RippleWaveLoader />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {error || "No trend data available"}
          </div>
        </CardContent>
      </Card>
    )
  }

  const bounceData = formatTrendData(data.console_bounce_rate_trend)
  const complaintData = formatTrendData(data.console_complaint_rate_trend)

  console.log('Bounce Trend:', data.console_bounce_rate_trend);
  console.log('Complaint Trend:', data.console_complaint_rate_trend);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Bounce Rate Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bounce Rate Trend</CardTitle>
          <CardDescription>
            Console bounce rate over the last {trendDays} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bounceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={EMAIL_HEALTH_THRESHOLDS.bounce.warning} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                label="Warning (5%)"
              />
              <ReferenceLine 
                y={EMAIL_HEALTH_THRESHOLDS.bounce.danger} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Risk (10%)"
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Complaint Rate Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Rate Trend</CardTitle>
          <CardDescription>
            Console complaint rate over the last {trendDays} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complaintData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={EMAIL_HEALTH_THRESHOLDS.complaint.warning} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                label="Warning (0.1%)"
              />
              <ReferenceLine 
                y={EMAIL_HEALTH_THRESHOLDS.complaint.danger} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Risk (0.5%)"
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}