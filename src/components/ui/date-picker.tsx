"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value
    if (dateString && onChange) {
      // O input date retorna "YYYY-MM-DD". O construtor new Date() pode ter problemas com fuso horário.
      // Adicionar a hora ao meio-dia local evita que a data mude por questões de UTC.
      const date = new Date(`${dateString}T12:00:00`);
      onChange(date)
    } else if (onChange) {
      onChange(undefined)
    }
  }

  const formattedValue = value ? format(value, "yyyy-MM-dd") : ""

  return (
    <div className="relative w-full">
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="date"
        value={formattedValue}
        onChange={handleChange}
        disabled={disabled}
        id={id}
        className={cn("pl-10", className)}
        placeholder={placeholder}
      />
    </div>
  )
}

DatePicker.displayName = "DatePicker"
