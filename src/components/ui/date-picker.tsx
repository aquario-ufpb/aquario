"use client";

import * as React from "react";
import { format, parse, setMonth, setYear } from "date-fns";
import type { Matcher } from "react-day-picker";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DatePickerProps = {
  /** Current value in "YYYY-MM-DD" format, or "" for empty */
  value: string;
  /** Callback with new value in "YYYY-MM-DD" format, or "" when cleared */
  onChange: (value: string) => void;
  /** Minimum selectable date in "YYYY-MM-DD" format */
  min?: string;
  /** Maximum selectable date in "YYYY-MM-DD" format */
  max?: string;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether the date can be cleared (default: true) */
  clearable?: boolean;
  /** Additional className for the trigger button */
  className?: string;
  /** HTML id for the trigger button (for label association) */
  id?: string;
  /** Whether the field is required (adds aria-required) */
  required?: boolean;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) {
    return undefined;
  }
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

function formatDateValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Selecionar data",
  disabled = false,
  clearable = true,
  className,
  id,
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = parseDate(value);
  const minDate = parseDate(min ?? "");
  const maxDate = parseDate(max ?? "");

  const currentYear = new Date().getFullYear();
  const fromYear = minDate ? minDate.getFullYear() : currentYear - 50;
  const toYear = maxDate ? maxDate.getFullYear() : currentYear + 10;

  const years = React.useMemo(() => {
    const arr: number[] = [];
    for (let y = fromYear; y <= toYear; y++) {
      arr.push(y);
    }
    return arr;
  }, [fromYear, toYear]);

  const defaultMonth = selectedDate ?? minDate ?? new Date();
  const [month, setMonthState] = React.useState<Date>(defaultMonth);

  // Sync month when popover opens or value changes
  React.useEffect(() => {
    if (open) {
      setMonthState(selectedDate ?? minDate ?? new Date());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const disabledDays: Matcher[] = [];
  if (minDate) {
    disabledDays.push({ before: minDate });
  }
  if (maxDate) {
    disabledDays.push({ after: maxDate });
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      if (clearable) {
        onChange("");
      }
      setOpen(false);
      return;
    }
    onChange(formatDateValue(date));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleMonthChange = (monthIndex: string) => {
    setMonthState(setMonth(month, parseInt(monthIndex)));
  };

  const handleYearChange = (year: string) => {
    setMonthState(setYear(month, parseInt(year)));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-required={required || undefined}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selectedDate ? (
            <span className="truncate">{format(selectedDate, "dd/MM/yyyy")}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          {clearable && selectedDate && (
            <X
              className="ml-auto h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <Select value={String(month.getMonth())} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 flex-1 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={i} value={String(i)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(month.getFullYear())} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[5.5rem] text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          required={required || !clearable}
          month={month}
          onMonthChange={setMonthState}
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
