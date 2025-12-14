"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatDateDisplay = React.useCallback((date: Date | undefined) => {
    if (!date) return placeholder
    try {
        return format(date, "PPP", { locale: ptBR })
    } catch(e) {
        return placeholder;
    }
  }, [placeholder])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          id={id}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown-buttons"
          fromYear={new Date().getFullYear() - 100}
          toYear={new Date().getFullYear() + 5}
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setIsOpen(false);
          }}
          initialFocus
          locale={ptBR}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"
