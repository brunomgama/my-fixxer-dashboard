"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "@/lib/context/translation"

interface TimePeriodSelectorProps {
  selectedDays: number
  onDaysChangeAction: (days: number) => void
  trendDays: number
  onTrendDaysChangeAction: (days: number) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function TimePeriodSelector({ selectedDays, onDaysChangeAction, onRefresh,isRefreshing = false}: TimePeriodSelectorProps) {
  const { t } = useTranslation();


  const periodOptions = [
    { label: "7days", value: 7 },
    { label: "14days", value: 14 },
    { label: "30days", value: 30 },
    { label: "60days", value: 60 },
    { label: "90days", value: 90 }
  ]

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Summary Period */}
        <div>
          <span className="text-sm font-medium text-muted-foreground">
            {t('time_period_select.summary')}
          </span>
          <ToggleGroup
            type="single"
            value={String(selectedDays)}
            onValueChange={(v) => onDaysChangeAction(Number(v))}
            className="mt-2 space-x-1"
          >
            {periodOptions.map(o => (
              <ToggleGroupItem key={o.value} value={String(o.value)}
              className="
                rounded-full
                px-3 py-1
                border
                data-[state=on]:bg-primary
                data-[state=on]:text-white
                data-[state=on]:border-primary
                transition-colors">
                {t('time_period_select.' + o.label) || o.label}

              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {t('time_period_select.cache_info')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}