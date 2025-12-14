
"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  ...props
}: DatePickerProps) {

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const dateString = event.target.value;
      if (dateString) {
        // O input type="date" retorna "YYYY-MM-DD". 
        // O fuso horário é interpretado como UTC, então parseISO é mais seguro.
        const date = parseISO(dateString);
        onChange(date);
      } else {
        onChange(undefined);
      }
    }
  };

  const formattedValue = value instanceof Date && !isNaN(value.getTime())
    ? format(value, "yyyy-MM-dd")
    : "";

  return (
    <Input
      type="date"
      value={formattedValue}
      onChange={handleInputChange}
      disabled={disabled}
      className={cn("w-full", className)}
      {...props}
    />
  )
}
