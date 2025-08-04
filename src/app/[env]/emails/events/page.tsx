"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { EventsEmailsApi } from '@/lib/api/events-emails'
import type { EmailEvent } from '@/lib/types/events-emails'
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RippleWaveLoader } from '@/components/ripple-wave-loader'
import { ChevronLeft, ChevronRight, AlertCircle, Database, Filter, BarChart3, TableIcon, Mail, MousePointer, AlertTriangle, Send } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { ChartContainer, ChartTooltip, ChartLegend,ChartLegendContent,type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart,Area} from 'recharts'

// TODO: Should i remove this? we only have events on production
// TODO: The bucket and the athena table are hardcoded for now, should we make them configurable?
const api = new EventsEmailsApi("production")

const EVENT_TYPE_COLORS: Record<string, string> = {
  Send:        'bg-green-100 text-green-700 border-green-200',
  Open:        'bg-blue-100 text-blue-700 border-blue-200',
  Click:       'bg-purple-100 text-purple-700 border-purple-200',
  Bounce:      'bg-red-100 text-red-700 border-red-200',
  Complaint:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  Delivery:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  Reject:      'bg-pink-100 text-pink-700 border-pink-200',
  RenderingFailure: 'bg-orange-100 text-orange-700 border-orange-200',
  Default:     'bg-gray-100 text-gray-700 border-gray-200'
}

const EMAIL_EVENT_FIELDS: { key: keyof EmailEvent, label: string }[] = [
  { key: 'event_type', label: 'Event Type' },
  { key: 'send_time', label: 'Send Time' },
  { key: 'message_id', label: 'Message ID' },
  { key: 'source_email', label: 'Source Email' },
  { key: 'header_subject', label: 'Header Subject' },
  { key: 'header_from', label: 'Header From' },
  { key: 'header_to', label: 'Header To' },
  { key: 'source_arn', label: 'Source ARN' },
  { key: 'sendingaccountid', label: 'Sending Account ID' },
  { key: 'from_domain', label: 'From Domain' },
  { key: 'utm_campaign_id', label: 'UTM Campaign ID' },
  { key: 'template_id', label: 'Template ID' },
  { key: 'environment', label: 'Environment' },
  { key: 'locale', label: 'Locale' },
  { key: 'homeowner_id', label: 'Homeowner ID' },
  { key: 'pro_id', label: 'Pro ID' },
  { key: 'utm_source', label: 'UTM Source' },
  { key: 'request_id', label: 'Request ID' },
  { key: 'invoice_id', label: 'Invoice ID' },
  { key: 'claim_id', label: 'Claim ID' },
  { key: 'intervention_id', label: 'Intervention ID' },
  { key: 'admin_id', label: 'Admin ID' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'subject', label: 'Subject' },
  { key: 'delivery_time', label: 'Delivery Time' }
]

const displayValue = (value?: string, fallback = '-') =>
  !value || value === 'NULL' || value === '' ? fallback : value

function buildQuery(lastMessageId: string | null, pageSize: number) {
  if (!lastMessageId) {
    return `
      SELECT * FROM "AwsDataCatalog"."emails-logs-db-prod-mri"."processed"
      ORDER BY message_id DESC
      LIMIT ${pageSize}
    `
  }
  return `
    SELECT * FROM "AwsDataCatalog"."emails-logs-db-prod-mri"."processed"
    WHERE message_id < '${lastMessageId}'
    ORDER BY message_id DESC
    LIMIT ${pageSize}
  `
}

function buildAnalyticsQuery(filter?: { type: 'campaign' | 'message' | 'source', value: string }) {
  let baseQuery = `
    SELECT * FROM "AwsDataCatalog"."emails-logs-db-prod-mri"."processed"
  `
  
  if (filter) {
    switch (filter.type) {
      case 'campaign':
        baseQuery += ` WHERE utm_campaign_id = '${filter.value}'`
        break
      case 'message':
        baseQuery += ` WHERE message_id = '${filter.value}'`
        break
      case 'source':
        baseQuery += ` WHERE source_email = '${filter.value}'`
        break
    }
  }
  
  baseQuery += ` ORDER BY send_time DESC LIMIT 50000`
  return baseQuery
}

function getEventTypeClass(eventType?: string) {
  if (!eventType) return EVENT_TYPE_COLORS.Default
  return EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.Default
}

type ViewMode = 'table' | 'charts'
type FilterType = 'all' | 'campaign' | 'message' | 'source'

interface EmailMetrics {
  totalEvents: number
  totalSend: number
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
}

interface PerformanceData {
  sendToDelivery: number
  deliveryToOpen: number
  openToClick: number
}

interface OptimalTimeData {
  hour: number
  opens: number
  sends: number
  rate: number
}

interface LocaleEngagement {
  locale: string
  opens: number
  clicks: number
  sends: number
  engagement: number
}

interface TrendData {
  date: string
  sends: number
  opens: number
  clicks: number
  bounces: number
}

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
]

export default function EmailEventsPage() {
  const [events, setEvents] = useState<EmailEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [pageStack, setPageStack] = useState<(string | null)[]>([null])
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [pageSize, setPageSize] = useState<number>(10)
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState<boolean>(true)
  const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1

  const cursor = pageStack[pageStack.length - 1]

  const [viewMode, setViewMode] = useState<ViewMode>('charts')
  const [allEvents, setAllEvents] = useState<EmailEvent[]>([])
  const [loadingAllData, setLoadingAllData] = useState(false)

  // New filter states
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterValue, setFilterValue] = useState<string>('')

  useEffect(() => {
    setCurrentPage(1)
    setPageStack([null])
  }, [pageSize])

  useEffect(() => {
    setLoadingCount(true)
    api.runQuery(`
      SELECT count(*) as total FROM "AwsDataCatalog"."emails-logs-db-prod-mri"."processed"
    `)
      .then(data => {
        const count = Array.isArray(data) && data[0] && 'total' in data[0] ? parseInt(data[0].total as string, 10) : 0
        setTotalCount(count)
      })
      .catch(err => setTotalCount(null))
      .finally(() => setLoadingCount(false))
  }, [pageSize])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.runQuery(buildQuery(cursor, pageSize))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err.message || 'Unknown error')
        setEvents([])
      })
      .finally(() => setLoading(false))
  }, [cursor, pageSize])

  useEffect(() => {
    if (viewMode === 'charts') {
      setLoadingAllData(true)
      setError(null)
      
      const filter = filterType !== 'all' && filterValue.trim() ? 
        { type: filterType as 'campaign' | 'message' | 'source', value: filterValue.trim() } : 
        undefined

      api.runQuery(buildAnalyticsQuery(filter))
        .then((data) => {
          setAllEvents(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error('Failed to fetch analytics data:', err)
          setError(err.message || 'Failed to fetch analytics data')
          setAllEvents([])
        })
        .finally(() => setLoadingAllData(false))
    }
  }, [viewMode, filterType, filterValue])

  const emailMetrics = useMemo((): EmailMetrics => {
    if (allEvents.length === 0) {
      return {
        totalEvents: 0,
        totalSend: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        complaintRate: 0
      }
    }

    const eventCounts = allEvents.reduce((acc, event) => {
      const type = event.event_type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sends = eventCounts.Send || 0
    const opens = eventCounts.Open || 0
    const clicks = eventCounts.Click || 0
    const bounces = eventCounts.Bounce || 0
    const complaints = eventCounts.Complaint || 0

    return {
      totalEvents: allEvents.length,
      totalSend: sends,
      openRate: sends > 0 ? (opens / sends) * 100 : 0,
      clickRate: opens > 0 ? (clicks / opens) * 100 : 0,
      bounceRate: sends > 0 ? (bounces / sends) * 100 : 0,
      complaintRate: sends > 0 ? (complaints / sends) * 100 : 0
    }
  }, [allEvents])

  const optimalOpenTimes = useMemo((): OptimalTimeData[] => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      opens: 0,
      sends: 0,
      rate: 0
    }))

    allEvents.forEach(event => {
      if (event.send_time) {
        const hour = new Date(event.send_time).getHours()
        if (event.event_type === 'Send') {
          hourlyData[hour].sends++
        } else if (event.event_type === 'Open') {
          hourlyData[hour].opens++
        }
      }
    })

    return hourlyData.map(data => ({
      ...data,
      rate: data.sends > 0 ? (data.opens / data.sends) * 100 : 0
    }))
  }, [allEvents])

  const localeEngagement = useMemo((): LocaleEngagement[] => {
    const messagesByLocale: Record<string, Set<string>> = {}
    const localeData: Record<string, { sends: number, opens: number, clicks: number, uniqueMessages: Set<string> }> = {}

    allEvents.forEach(event => {
      const locale = event.locale || 'unknown'
      const messageId = event.message_id || 'unknown'
      
      if (!localeData[locale]) {
        localeData[locale] = { sends: 0, opens: 0, clicks: 0, uniqueMessages: new Set() }
      }
      if (!messagesByLocale[locale]) {
        messagesByLocale[locale] = new Set()
      }

      localeData[locale].uniqueMessages.add(messageId)

      switch (event.event_type) {
        case 'Send':
          if (!messagesByLocale[locale].has(`send-${messageId}`)) {
            localeData[locale].sends++
            messagesByLocale[locale].add(`send-${messageId}`)
          }
          break
        case 'Open':
          if (!messagesByLocale[locale].has(`open-${messageId}`)) {
            localeData[locale].opens++
            messagesByLocale[locale].add(`open-${messageId}`)
          }
          break
        case 'Click':
          if (!messagesByLocale[locale].has(`click-${messageId}`)) {
            localeData[locale].clicks++
            messagesByLocale[locale].add(`click-${messageId}`)
          }
          break
      }
    })

    return Object.entries(localeData)
      .map(([locale, data]) => ({
        locale,
        sends: data.sends,
        opens: data.opens,
        clicks: data.clicks,
        engagement: data.sends > 0 ? (data.opens / data.sends) * 100 : 0
      }))
      .filter(item => item.sends > 0)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10)
  }, [allEvents])

  const trendData = useMemo((): TrendData[] => {
    const dailyData: Record<string, { sends: number, opens: number, clicks: number, bounces: number }> = {}

    allEvents.forEach(event => {
      if (event.send_time) {
        const date = new Date(event.send_time).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { sends: 0, opens: 0, clicks: 0, bounces: 0 }
        }

        switch (event.event_type) {
          case 'Send':
            dailyData[date].sends++
            break
          case 'Open':
            dailyData[date].opens++
            break
          case 'Click':
            dailyData[date].clicks++
            break
          case 'Bounce':
            dailyData[date].bounces++
            break
        }
      }
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
  }, [allEvents])

  const chartConfig: ChartConfig = {
    Send: { label: "Send", color: "#10b981" },
    Open: { label: "Open", color: "#3b82f6" },
    Click: { label: "Click", color: "#8b5cf6" },
    Bounce: { label: "Bounce", color: "#ef4444" },
    Complaint: { label: "Complaint", color: "#f59e0b" },
    Delivery: { label: "Delivery", color: "#06b6d4" },
    Reject: { label: "Reject", color: "#ec4899" },
    RenderingFailure: { label: "Rendering Failure", color: "#f97316" },
  }

  const handleNext = () => {
    if (!events || events.length === 0) return
    const lastMessageId = events[events.length - 1]?.message_id || null
    setPageStack(prev => [...prev, lastMessageId])
    setCurrentPage(prev => prev + 1)
  }

  const handlePrev = () => {
    if (pageStack.length <= 1) return
    setPageStack(prev => prev.slice(0, prev.length - 1))
    setCurrentPage(prev => prev - 1)
  }

  const handleFilterApply = () => {
    if (viewMode === 'charts') {
      setLoadingAllData(true)
      const filter = filterType !== 'all' && filterValue.trim() ? 
        { type: filterType as 'campaign' | 'message' | 'source', value: filterValue.trim() } : 
        undefined

      api.runQuery(buildAnalyticsQuery(filter))
        .then((data) => {
          setAllEvents(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error('Failed to fetch filtered data:', err)
          setError(err.message || 'Failed to fetch filtered data')
          setAllEvents([])
        })
        .finally(() => setLoadingAllData(false))
    }
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatNumber = (value: number) => value.toLocaleString()

  return (
    <div className="m-4 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Email Events Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Real-time email performance metrics and insights from AWS Athena
        </p>
      </div>

      {/* View Toggle and Controls */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Analytics Controls</h2>
          </div>
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value: ViewMode) => value && setViewMode(value)}
          >
            <ToggleGroupItem value="charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </ToggleGroupItem>
            <ToggleGroupItem value="table">
              <TableIcon className="h-4 w-4 mr-2" />
              Raw Data
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">Filter by:</label>
          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="campaign">Campaign ID</SelectItem>
              <SelectItem value="message">Message ID</SelectItem>
              <SelectItem value="source">Source Email</SelectItem>
            </SelectContent>
          </Select>
          
          {filterType !== 'all' && (
            <>
              <Input
                placeholder={`Enter ${filterType === 'campaign' ? 'campaign ID' : filterType === 'message' ? 'message ID' : 'source email'}`}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="flex-1 max-w-[300px]"
              />
              <Button 
                onClick={handleFilterApply}
                disabled={loadingAllData}
                size="sm"
              >
                Apply Filter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load email events: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      {viewMode === 'charts' ? (
        /* Charts View */
        <div className="space-y-6">
          {loadingAllData ? (
            <div className="bg-card border rounded-lg p-12">
              <div className="flex items-center justify-center">
                <RippleWaveLoader />
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm font-medium">Total Events</div>
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(emailMetrics.totalEvents)}</div>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4 text-green-600" />
                    <div className="text-sm font-medium">Total Send</div>
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(emailMetrics.totalSend)}</div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div className="text-sm font-medium">Open Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatPercentage(emailMetrics.openRate)}</div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-purple-600" />
                    <div className="text-sm font-medium">Click Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{formatPercentage(emailMetrics.clickRate)}</div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="text-sm font-medium">Bounce Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{formatPercentage(emailMetrics.bounceRate)}</div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <div className="text-sm font-medium">Complaint Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{formatPercentage(emailMetrics.complaintRate)}</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Optimal Open Times */}
                <div className="bg-card border rounded-lg">
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-semibold">Optimal Open Times (24h)</h3>
                    <p className="text-sm text-muted-foreground">Email open rates by hour of day</p>
                  </div>
                  <div className="p-6 pt-2">
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={optimalOpenTimes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <ChartTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-md">
                                  <p className="font-medium">{`${label}:00`}</p>
                                  <p className="text-sm text-blue-600">{`Opens: ${data.opens}`}</p>
                                  <p className="text-sm text-green-600">{`Sends: ${data.sends}`}</p>
                                  <p className="text-sm font-medium">{`Rate: ${data.rate.toFixed(1)}%`}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>

                {/* Email Engagement by Locale */}
                <div className="bg-card border rounded-lg">
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-semibold">Email Engagement by Locale</h3>
                    <p className="text-sm text-muted-foreground">Top performing locales by engagement rate</p>
                  </div>
                  <div className="p-6 pt-2">
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={localeEngagement} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          type="category"
                          dataKey="locale"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                        />
                        <ChartTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-md">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-sm text-green-600">{`Sends: ${data.sends}`}</p>
                                  <p className="text-sm text-blue-600">{`Opens: ${data.opens}`}</p>
                                  <p className="text-sm text-purple-600">{`Clicks: ${data.clicks}`}</p>
                                  <p className="text-sm font-medium">{`Engagement: ${data.engagement.toFixed(1)}%`}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="engagement" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              </div>

              {/* 30 Days Performance Trends */}
              <div className="bg-card border rounded-lg">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold">30 Days Performance Trends</h3>
                  <p className="text-sm text-muted-foreground">Daily email performance over the last 30 days</p>
                </div>
                <div className="p-6 pt-2">
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-md">
                                <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                                {payload.map((entry, index) => (
                                  <p key={index} className="text-sm" style={{ color: entry.color }}>
                                    {`${entry.name}: ${entry.value}`}
                                  </p>
                                ))}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="sends"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="opens"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="bounces"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Table View - Raw Data */
        <div className="bg-card border rounded-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Raw Event Data</h3>
                <p className="text-sm text-muted-foreground">Detailed email event logs</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium whitespace-nowrap">Rows per page:</label>
                <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RippleWaveLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {EMAIL_EVENT_FIELDS.map(f => (
                        <TableHead key={f.key} className="font-semibold">
                          {f.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={EMAIL_EVENT_FIELDS.length} 
                          className="text-center py-12 text-muted-foreground"
                        >
                          No email events found for the current query.
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event, index) => (
                        <TableRow 
                          key={`${event.message_id ?? 'no-id'}-${index}`}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {EMAIL_EVENT_FIELDS.map(f => (
                            <TableCell
                              key={f.key}
                              title={displayValue(event[f.key])}
                              className={`${f.key === 'message_id' ? 'font-mono text-xs' : ''} max-w-[200px] truncate`}
                            >
                              {f.key === 'event_type' ? (
                                <Badge 
                                  variant="outline" 
                                  className={`${getEventTypeClass(event.event_type)} border font-medium`}
                                >
                                  {displayValue(event.event_type)}
                                </Badge>
                              ) : (
                                <span className="block truncate">
                                  {displayValue(event[f.key])}
                                </span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          {/* Table Pagination */}
          <div className="p-6 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
              {totalCount !== null && (
                <span className="ml-2">
                  ({totalCount.toLocaleString()} total events)
                </span>
              )}
              {loadingCount && <span className="ml-2">(counting...)</span>}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => {
                  if (pageStack.length <= 1) return
                  setPageStack(prev => prev.slice(0, prev.length - 1))
                  setCurrentPage(prev => prev - 1)
                }}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={events.length < pageSize || currentPage === totalPages || loading}
                onClick={() => {
                  if (!events || events.length === 0) return
                  const lastMessageId = events[events.length - 1]?.message_id || null
                  setPageStack(prev => [...prev, lastMessageId])
                  setCurrentPage(prev => prev + 1)
                }}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
