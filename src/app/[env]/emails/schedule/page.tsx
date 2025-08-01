"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useEnvironment } from "@/lib/context/environment"
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
import { 
  IconPlus, 
  IconCalendar, 
  IconTable, 
  IconEdit, 
  IconTrash,
  IconClock,
  IconMail,
  IconX,
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react"
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
          title: campaign?.name || 'Unknown Campaign',
          date: date.toISOString().split('T')[0],
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          campaignId: schedule.campaignId,
          schedule
        }
      })
      setCalendarEvents(events)
    } catch {
      setError("Failed to fetch schedules")
    } finally {
      setLoading(false)
    }
  }, [scheduleApi, campaignApi])

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
        showToast("Success", "Schedule updated", "success")
      } else {
        await scheduleApi.create(scheduleData)
        showToast("Success", "Schedule created", "success")
      }
      
      setIsSliderOpen(false)
      fetchData()
    } catch (error) {
      showToast("Error", "Failed to save schedule", "error")
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    try {
      await scheduleApi.delete(selectedId)
      showToast("Success", "Schedule deleted", "success")
      fetchData()
    } catch {
      showToast("Error", "Failed to delete schedule", "error")
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

  if (loading) return <RippleWaveLoader />
  if (error) return <p className="p-4 text-destructive">{error}</p>

  return (
    <div className="space-y-6 mr-4 relative">
      <Toaster ref={toasterRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-muted-foreground">Manage email campaign schedules</p>
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
              Calendar
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <IconTable className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>
          
          <Button onClick={handleCreateNew}>
            <IconPlus className="w-4 h-4 mr-2" />
            Schedule Email
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
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <IconChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium">
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
                <TableHead>Campaign</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        {campaign?.name || 'Unknown Campaign'}
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
                          {schedule.emailReceiver.length} recipient{schedule.emailReceiver.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {Object.keys(schedule.variables).length} variable{Object.keys(schedule.variables).length !== 1 ? 's' : ''}
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
                    No schedules found.
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
                {selectedSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeSlider}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Campaign Selection */}
              <div>
                <Label htmlFor="campaign">Campaign *</Label>
                <Select 
                  value={formData.campaignId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, campaignId: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Campaign" />
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
                <Label htmlFor="scheduled_time">Scheduled Time *</Label>
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
                <Label htmlFor="emailReceiver">Email Recipients</Label>
                <Textarea
                  id="emailReceiver"
                  value={formData.emailReceiver}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailReceiver: e.target.value }))}
                  placeholder="Enter email addresses separated by commas"
                  disabled={!isEditing}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* Variables */}
              <div>
                <Label htmlFor="variables">Variables (JSON)</Label>
                <Textarea
                  id="variables"
                  value={formData.variables}
                  onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder='{"key": "value"}'
                  disabled={!isEditing}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} className="flex-1">
                      {selectedSchedule ? 'Update' : 'Create'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} className="flex-1">
                      <IconEdit className="w-4 h-4 mr-2" />
                      Edit
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
        title="Confirm Deletion"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
      />
    </div>
  )
}