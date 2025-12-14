"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';
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
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Garante que o valor passado para o `format` é um objeto Date válido.
  const displayValue = value instanceof Date && !isNaN(value.getTime())
    ? format(value, "PPP", { locale: ptBR })
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue ? displayValue : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (onChange) onChange(date);
            setIsOpen(false);
          }}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={new Date().getFullYear() - 80}
          toYear={new Date().getFullYear() + 10}
        />
      </PopoverContent>
    </Popover>
  )
}
