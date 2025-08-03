"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { ScheduleApi } from "@/lib/api/schedule"
import { CampaignApi } from "@/lib/api/campaign"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { Badge } from "@/components/ui/badge"
import { Schedule } from "@/lib/types/schedule"
import { Campaign } from "@/lib/types/campaign"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"
import { IconPlus, IconCalendar, IconTable, IconEdit, IconTrash, IconClock,
  IconMail, IconX, IconChevronLeft, IconChevronRight} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ViewMode = 'calendar' | 'table'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  campaignId: string
  schedule: Schedule
}

export default function SchedulePage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const scheduleApi = useMemo(() => new ScheduleApi(env), [env])
  const campaignApi = useMemo(() => new CampaignApi(env), [env])

  const { toasterRef, showToast } = useToast()

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Calendar view state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  
  // Sliding panel state
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    campaignId: '',
    emailReceiver: '',
    scheduled_time: '',
    variables: '{}'
  })
  
  // Delete modal state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [scheduleResult, campaignResult] = await Promise.all([
        scheduleApi.list({ limit: 1000 }),
        campaignApi.list({ limit: 1000 })
      ])
      setSchedules(scheduleResult.results)
      setCampaigns(campaignResult.results)
      
      // Transform schedules to calendar events
      const events: CalendarEvent[] = scheduleResult.results.map(schedule => {
        const campaign = campaignResult.results.find(c => c.id === schedule.campaignId)
        const date = new Date(schedule.scheduled_time)
        return {
          id: schedule.id,
          title: campaign?.name || t('schedules.unknownCampaign'),
          date: date.toISOString().split('T')[0],
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          campaignId: schedule.campaignId,
          schedule
        }
      })
      setCalendarEvents(events)
    } catch {
      setError(t('schedules.failedToFetchSchedules'))
    } finally {
      setLoading(false)
    }
  }, [scheduleApi, campaignApi, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setFormData({
      campaignId: schedule.campaignId,
      emailReceiver: schedule.emailReceiver.join(', '),
      scheduled_time: schedule.scheduled_time,
      variables: JSON.stringify(schedule.variables, null, 2)
    })
    setIsEditing(false)
    setIsSliderOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedSchedule(null)
    setFormData({
      campaignId: '',
      emailReceiver: '',
      scheduled_time: '',
      variables: '{}'
    })
    setIsEditing(true)
    setIsSliderOpen(true)
  }

  const handleSave = async () => {
    try {
      const emailReceiverArray = formData.emailReceiver
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
      
      const variables = JSON.parse(formData.variables || '{}')
      
      const scheduleData = {
        campaignId: formData.campaignId,
        emailReceiver: emailReceiverArray,
        scheduled_time: formData.scheduled_time,
        variables
      }

      if (selectedSchedule) {
        await scheduleApi.update(selectedSchedule.id, scheduleData)
        showToast(t('common.success'), t('schedules.scheduleUpdated'), "success")
      } else {
        await scheduleApi.create(scheduleData)
        showToast(t('common.success'), t('schedules.scheduleCreated'), "success")
      }
      
      setIsSliderOpen(false)
      fetchData()
    } catch (error) {
      showToast(t('common.error'), t('schedules.failedToSaveSchedule'), "error")
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await scheduleApi.delete(selectedId)
      showToast(t('common.success'), t('schedules.scheduleDeleted'), "success")
      fetchData()
    } catch {
      showToast(t('common.error'), t('schedules.failedToDeleteSchedule'), "error")
    } finally {
      setSelectedId(null)
      setIsDeleting(false)
    }
  }

  const closeSlider = () => {
    setIsSliderOpen(false)
    setSelectedSchedule(null)
    setIsEditing(false)
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (dateStr: string) => {
    return calendarEvents.filter(event => event.date === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Calendar helper functions - add month names translation
  const getMonthName = (date: Date) => {
    const monthKey = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ][date.getMonth()]
    return t(`schedules.monthNames.${monthKey}`)
  }

  const getWeekdayNames = () => [
    t('schedules.weekdays.sun'),
    t('schedules.weekdays.mon'),
    t('schedules.weekdays.tue'),
    t('schedules.weekdays.wed'),
    t('schedules.weekdays.thu'),
    t('schedules.weekdays.fri'),
    t('schedules.weekdays.sat')
  ]

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4 relative">
      <Toaster ref={toasterRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('schedules.title')}</h1>
          <p className="text-muted-foreground">{t('schedules.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="px-3"
            >
              <IconCalendar className="w-4 h-4 mr-2" />
              {t('schedules.calendar')}
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <IconTable className="w-4 h-4 mr-2" />
              {t('schedules.table')}
            </Button>
          </div>
          
          <Button onClick={handleCreateNew}>
            <IconPlus className="w-4 h-4 mr-2" />
            {t('schedules.scheduleEmail')}
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <IconChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {getMonthName(currentDate)} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <IconChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {getWeekdayNames().map((day, index) => (
                <div key={index} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 h-24 border-r border-b bg-muted/20" />
              ))}
              
              {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                const day = i + 1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const events = getEventsForDate(dateStr)
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                
                return (
                  <div key={day} className={`p-2 h-24 border-r border-b hover:bg-muted/50 transition-colors ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {day}
                      {isToday && <span className="ml-1 text-xs">({t('schedules.today')})</span>}
                    </div>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {events.map(event => (
                        <div
                          key={event.id}
                          onClick={() => handleScheduleClick(event.schedule)}
                          className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors truncate"
                        >
                          {event.time} - {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('schedules.campaign')}</TableHead>
                <TableHead>{t('schedules.scheduledTime')}</TableHead>
                <TableHead>{t('schedules.recipients')}</TableHead>
                <TableHead>{t('schedules.variables')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length > 0 ? (
                schedules.map((schedule) => {
                  const campaign = campaigns.find(c => c.id === schedule.campaignId)
                  const { date, time } = formatDateTime(schedule.scheduled_time)
                  
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-muted-foreground shrink-0" />
                        {campaign?.name || t('schedules.unknownCampaign')}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-muted-foreground">{time}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {(schedule.emailReceiver?.length || 0)} {(schedule.emailReceiver?.length === 1 ? t('schedules.recipient') : t('schedules.recipientPlural'))}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {Object.keys(schedule.variables).length} {Object.keys(schedule.variables).length === 1 ? t('schedules.variable') : t('schedules.variablePlural')}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleScheduleClick(schedule)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive" 
                          onClick={() => setSelectedId(schedule.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {t('schedules.noSchedulesFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sliding Panel */}
      {isSliderOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeSlider}
          />
          
          {/* Slider */}
          <div className="fixed right-0 top-0 h-full w-96 bg-background border-l z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {selectedSchedule ? t('schedules.editSchedule') : t('schedules.createSchedule')}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeSlider}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Campaign Selection */}
              <div>
                <Label htmlFor="campaign">{t('schedules.campaign')} *</Label>
                <Select 
                  value={formData.campaignId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, campaignId: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedules.selectCampaign')} />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled Time */}
              <div>
                <Label htmlFor="scheduled_time">{t('schedules.scheduledTime')} *</Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={formData.scheduled_time ? new Date(formData.scheduled_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    scheduled_time: e.target.value ? new Date(e.target.value).toISOString() : ''
                  }))}
                  disabled={!isEditing}
                />
              </div>

              {/* Email Recipients */}
              <div>
                <Label htmlFor="emailReceiver">{t('schedules.emailRecipients')}</Label>
                <Textarea
                  id="emailReceiver"
                  value={formData.emailReceiver}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailReceiver: e.target.value }))}
                  placeholder={t('schedules.emailRecipientsPlaceholder')}
                  disabled={!isEditing}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('schedules.emailRecipientsHelp')}
                </p>
              </div>

              {/* Variables */}
              <div>
                <Label htmlFor="variables">{t('schedules.variables')} (JSON)</Label>
                <Textarea
                  id="variables"
                  value={formData.variables}
                  onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder={t('schedules.variablesPlaceholder')}
                  disabled={!isEditing}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} className="flex-1">
                      {selectedSchedule ? t('common.update') : t('common.create')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      {t('common.cancel')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} className="flex-1">
                      <IconEdit className="w-4 h-4 mr-2" />
                      {t('common.edit')}
                    </Button>
                    {selectedSchedule && (
                      <Button 
                        variant="outline" 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedId(selectedSchedule.id)
                          closeSlider()
                        }}
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={t('schedules.confirmDeletion')}
        description={t('schedules.deleteConfirmation')}
      />
    </div>
  )
}