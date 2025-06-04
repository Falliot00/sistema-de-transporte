// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/ui/date-range-picker.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale" // Spanish locale
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  onDateChange?: (dateRange?: DateRange) => void;
  disabled?: boolean;
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  disabled,
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date);

  React.useEffect(() => {
    setInternalDate(date);
  }, [date]);

  const handleSelect = (selectedDate?: DateRange) => {
    setInternalDate(selectedDate);
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !internalDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(internalDate.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(internalDate.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es} // Set locale for calendar
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}