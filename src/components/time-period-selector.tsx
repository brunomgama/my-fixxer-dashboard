"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"

interface TimePeriodSelectorProps {
  selectedDays: number
  onDaysChangeAction: (days: number) => void
  trendDays: number
  onTrendDaysChangeAction: (days: number) => void
}

export function TimePeriodSelector({ 
  selectedDays, 
  onDaysChangeAction, 
  trendDays, 
  onTrendDaysChangeAction 
}: TimePeriodSelectorProps) {
  const periodOptions = [
    { label: "7 days", value: 7 },
    { label: "14 days", value: 14 },
    { label: "30 days", value: 30 },
    { label: "60 days", value: 60 },
    { label: "90 days", value: 90 }
  ]

  // const trendOptions = [
  //   { label: "7 days", value: 7 },
  //   { label: "14 days", value: 14 },
  //   { label: "30 days", value: 30 },
  //   { label: "60 days", value: 60 },
  //   { label: "90 days", value: 90 }
  // ]

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        {/* Summary Period */}
        <div>
          <span className="text-sm font-medium text-muted-foreground">Summary</span>
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
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {/* Trend Analysis Period */}
        {/* <div className="sm:ml-auto mt-4 sm:mt-0">
          <span className="text-sm font-medium text-muted-foreground">Trend</span>
          <ToggleGroup
            type="single"
            value={String(trendDays)}
            onValueChange={(v) => onTrendDaysChangeAction(Number(v))}
            className="mt-2 space-x-1"
          >
            {trendOptions.map(o => (
              <ToggleGroupItem key={o.value} value={String(o.value)} 
              className="
                rounded-full
                px-3 py-1
                border
                data-[state=on]:bg-primary
                data-[state=on]:text-white
                data-[state=on]:border-primary
                transition-colors">
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div> */}
      </CardContent>
    </Card>
  )
}