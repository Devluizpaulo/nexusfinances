"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
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
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)

  // Sincronizar com valor externo
  React.useEffect(() => {
    setSelectedDate(value)
  }, [value])

  // Função para selecionar data
  const handleDateSelect = React.useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    onChange?.(date)
    setIsOpen(false) // Fechar popover após seleção
  }, [onChange])

  // Função para formatar data
  const formatDateDisplay = React.useCallback((date: Date | undefined) => {
    if (!date) return placeholder
    return format(date, "PPP", { locale: ptBR })
  }, [placeholder])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          id={id}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"
