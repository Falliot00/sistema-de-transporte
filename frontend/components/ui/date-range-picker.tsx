"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

interface DateRangePickerProps extends React.ComponentProps<"div"> {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  // --- INICIO DE LA SOLUCIÓN: Añadimos la prop 'disabled' ---
  // Hacemos que la prop sea opcional para no romper otros usos del componente.
  disabled?: boolean;
  // --- FIN DE LA SOLUCIÓN ---
}

export function DateRangePicker({ 
  className, 
  date, 
  onDateChange, 
  // --- INICIO DE LA SOLUCIÓN: Recibimos la nueva prop ---
  disabled 
  // --- FIN DE LA SOLUCIÓN ---
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            // --- INICIO DE LA SOLUCIÓN: Aplicamos la prop 'disabled' ---
            // Le pasamos la prop al botón subyacente. Si 'disabled' es true,
            // el botón se deshabilitará visual y funcionalmente.
            disabled={disabled}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
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
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}