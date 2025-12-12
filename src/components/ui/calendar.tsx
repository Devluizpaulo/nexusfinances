
"use client"

import * as React from "react"
import { useMemo, useCallback, forwardRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  minYear?: number;
  maxYear?: number;
  isLoading?: boolean;
};

interface CalendarDropdownProps {
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: React.ReactNode;
  "aria-label"?: string;
  disabled?: boolean;
}

const CalendarDropdown = React.forwardRef<
  HTMLButtonElement,
  CalendarDropdownProps
>((props, ref): React.ReactNode => {
  const { value, onChange, children, 'aria-label': ariaLabel } = props;

  const options = React.useMemo(
    () =>
      React.Children.toArray(
        children || []
      ) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[],
    [children]
  );

  const selected = React.useMemo(
    () => options.find((child) => child.props.value === value),
    [options, value]
  );

  const handleChange = React.useCallback(
    (value: string) => {
      const changeEvent = {
        target: { value },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange?.(changeEvent);
    },
    [onChange]
  );
  
  if (!children) {
    return null;
  }

  return (
    <Select
      value={value?.toString()}
      onValueChange={handleChange}
      disabled={props.disabled}
    >
      <SelectTrigger
        ref={ref}
        className="pr-1.5 focus:ring-0 h-8 text-xs w-fit bg-slate-900/80 border-slate-800/60 hover:bg-slate-800/60 focus:border-slate-600/80 text-slate-300 hover:text-slate-100 transition-colors"
        aria-label={ariaLabel}
      >
        <SelectValue className="text-foreground">
          {selected?.props?.children}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="z-50 bg-slate-950 border-slate-800 text-slate-100"
      >
        <ScrollArea className="h-72">
          {options.map((option, id: number) => (
            <SelectItem
              key={`${option.props.value}-${id}`}
              value={option.props.value?.toString() ?? ''}
              className="focus:bg-slate-800"
            >
              {option.props.children}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
});

CalendarDropdown.displayName = "CalendarDropdown";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  minYear,
  maxYear,
  isLoading = false,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();
  
  const defaultMinYear = minYear ?? currentYear - 10;
  const defaultMaxYear = maxYear ?? currentYear + 10;
  
  const calendarClassNames = useMemo(() => ({
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center gap-2",
    caption_label: "text-sm font-medium hidden",
    caption_dropdowns: "flex items-center gap-2",
    nav: "space-x-1 flex items-center",
    nav_button: cn(
      buttonVariants({ variant: "outline" }),
      "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-slate-800/60 transition-all duration-200"
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-800/60 hover:text-slate-100 transition-colors duration-200 rounded-md"
    ),
    day_range_end: "day-range-end",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-medium",
    day_today: "bg-accent text-accent-foreground font-bold border-2 border-slate-600",
    day_outside: "day-outside text-slate-500 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
    day_disabled: "text-slate-500 opacity-50 cursor-not-allowed",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
    ...classNames,
  }), [classNames]);
  
  const calendarComponents = useMemo(() => ({
    IconLeft: ({ ...props }) => (
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    ),
    IconRight: ({ ...props }) => (
      <ChevronRight className="h-5 w-5" aria-hidden="true" />
    ),
    Dropdown: CalendarDropdown as React.ElementType,
  }), []);
  
  if (isLoading) {
    return (
      <div className={cn("p-3", className)}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-center gap-2">
            <div className="h-8 w-20 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-9 bg-slate-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DayPicker
      captionLayout="dropdown-buttons"
      fromYear={defaultMinYear}
      toYear={defaultMaxYear}
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={calendarClassNames}
      components={calendarComponents}
      disabled={isLoading}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
