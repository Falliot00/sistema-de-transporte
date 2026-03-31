"use client"

import * as React from "react"
import {
  format,
  isSameDay,
  lastDayOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<"div"> {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  disabled?: boolean
}

interface QuickRangePreset {
  key: string
  label: string
  getRange: () => DateRange
}

const QUICK_PRESETS: QuickRangePreset[] = [
  {
    key: "today",
    label: "Hoy",
    getRange: () => {
      const today = startOfDay(new Date())
      return { from: today, to: today }
    },
  },
  {
    key: "yesterday",
    label: "Ayer",
    getRange: () => {
      const yesterday = startOfDay(subDays(new Date(), 1))
      return { from: yesterday, to: yesterday }
    },
  },
  {
    key: "last-7-days",
    label: "Ultimos 7 dias",
    getRange: () => {
      const today = startOfDay(new Date())
      return { from: startOfDay(subDays(today, 6)), to: today }
    },
  },
  {
    key: "last-30-days",
    label: "Ultimos 30 dias",
    getRange: () => {
      const today = startOfDay(new Date())
      return { from: startOfDay(subDays(today, 29)), to: today }
    },
  },
  {
    key: "this-month",
    label: "Este mes",
    getRange: () => {
      const today = startOfDay(new Date())
      return { from: startOfMonth(today), to: today }
    },
  },
  {
    key: "last-month",
    label: "Mes pasado",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        from: startOfMonth(lastMonth),
        to: startOfDay(lastDayOfMonth(lastMonth)),
      }
    },
  },
]

const formatDateRange = (date: DateRange | undefined): string => {
  if (!date?.from) {
    return "Seleccionar periodo"
  }

  if (!date.to) {
    return format(date.from, "dd MMM, y", { locale: es })
  }

  return `${format(date.from, "dd MMM, y", { locale: es })} - ${format(
    date.to,
    "dd MMM, y",
    { locale: es }
  )}`
}

const isSameRange = (left?: DateRange, right?: DateRange) => {
  if (!left?.from || !left?.to || !right?.from || !right?.to) {
    return false
  }

  return isSameDay(left.from, right.from) && isSameDay(left.to, right.to)
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  disabled,
  ...props
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const activePresetKey = React.useMemo(() => {
    if (!date?.from || !date?.to) {
      return undefined
    }

    return QUICK_PRESETS.find((preset) => isSameRange(date, preset.getRange()))?.key
  }, [date])

  const handlePresetSelect = (preset: QuickRangePreset) => {
    onDateChange(preset.getRange())
    setIsOpen(false)
  }

  const handleCalendarSelect = (nextDate: DateRange | undefined) => {
    onDateChange(nextDate)
    if (nextDate?.from && nextDate?.to) {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    onDateChange(undefined)
    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker-trigger"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 w-full min-w-[220px] justify-start text-left font-normal sm:w-[320px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="truncate">{formatDateRange(date)}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
          <div className="grid gap-2 p-3 sm:grid-cols-3">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                size="sm"
                variant={activePresetKey === preset.key ? "default" : "outline"}
                onClick={() => handlePresetSelect(preset)}
                className="justify-start"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Separator />

          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from ?? new Date()}
            selected={date}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={es}
          />

          <Separator />

          <div className="flex items-center justify-between p-3">
            <p className="text-xs text-muted-foreground">{formatDateRange(date)}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!date?.from}
            >
              <X className="mr-1 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
