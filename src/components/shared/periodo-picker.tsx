"use client";

import * as React from "react";
import { format, parse, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type Kind = "start" | "end";

type Props = {
  /** ISO date (YYYY-MM-DD) or empty string */
  value: string;
  onChange: (value: string) => void;
  /** Affects how semester quick-buttons map to a date. */
  kind: Kind;
  placeholder?: string;
  className?: string;
  id?: string;
};

function parseDate(s: string): Date | undefined {
  if (!s) {
    return undefined;
  }
  return parse(s, "yyyy-MM-dd", new Date());
}

/**
 * Map a UFPB-style semester ("YYYY.1" or "YYYY.2") to an ISO date.
 *  - 2024.1 → starts Feb 1, ends Jul 31
 *  - 2024.2 → starts Aug 1, ends Dec 31
 */
function semesterToDate(year: number, half: 1 | 2, kind: Kind): string {
  if (half === 1) {
    return kind === "start" ? `${year}-02-01` : `${year}-07-31`;
  }
  return kind === "start" ? `${year}-08-01` : `${year}-12-31`;
}

/** Generate the last N semesters (newest first) up to the current academic year. */
function recentSemesters(
  count: number,
  now: Date = new Date()
): Array<{ year: number; half: 1 | 2 }> {
  const out: Array<{ year: number; half: 1 | 2 }> = [];
  let year = now.getFullYear();
  let half: 1 | 2 = now.getMonth() < 7 ? 1 : 2; // months 0-6 = first half
  for (let i = 0; i < count; i++) {
    out.push({ year, half });
    if (half === 1) {
      half = 2;
      year -= 1;
    } else {
      half = 1;
    }
  }
  return out;
}

export function PeriodoPicker({
  value,
  onChange,
  kind,
  placeholder = "Selecionar período",
  className,
  id,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = parseDate(value);
  const today = new Date();
  const currentYear = today.getFullYear();
  const fromYear = currentYear - 30;
  const toYear = currentYear + 5;

  const years = React.useMemo(() => {
    const arr: number[] = [];
    for (let y = fromYear; y <= toYear; y++) {
      arr.push(y);
    }
    return arr;
  }, [fromYear, toYear]);

  const defaultMonth = selectedDate ?? today;
  const [month, setMonthState] = React.useState<Date>(defaultMonth);

  React.useEffect(() => {
    if (open) {
      setMonthState(selectedDate ?? today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const semesters = React.useMemo(() => recentSemesters(8, today), [today]);

  const handleSemesterClick = (year: number, half: 1 | 2) => {
    onChange(semesterToDate(year, half, kind));
    setOpen(false);
  };

  const handleMonthYearApply = () => {
    // For "start", first day of month; for "end", last day.
    const y = month.getFullYear();
    const m = month.getMonth();
    if (kind === "start") {
      onChange(format(new Date(y, m, 1), "yyyy-MM-dd"));
    } else {
      // last day of month: day 0 of next month
      onChange(format(new Date(y, m + 1, 0), "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const buttonLabel = selectedDate
    ? format(selectedDate, "MMM/yyyy", { locale: ptBR })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate capitalize">{buttonLabel}</span>
          {selectedDate && (
            <X
              className="ml-auto h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Semestre
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {semesters.map(s => (
                <Button
                  key={`${s.year}.${s.half}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleSemesterClick(s.year, s.half)}
                >
                  {s.year}.{s.half}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Mês específico
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(month.getMonth())}
                onValueChange={v => setMonthState(setMonth(month, parseInt(v)))}
              >
                <SelectTrigger className="h-8 flex-1 text-sm">
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
              <Select
                value={String(month.getFullYear())}
                onValueChange={v => setMonthState(setYear(month, parseInt(v)))}
              >
                <SelectTrigger className="h-8 w-[5.5rem] text-sm">
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
            <Button
              type="button"
              size="sm"
              className="w-full mt-2 bg-aquario-primary text-white hover:bg-aquario-primary/90"
              onClick={handleMonthYearApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper: derive a date string for ingest scripts that want to parse "2024.1" etc.
export function parseSemester(input: string, kind: Kind): string | null {
  const m = input.trim().match(/^(\d{4})\.([12])$/);
  if (!m) {
    return null;
  }
  return semesterToDate(parseInt(m[1]), parseInt(m[2]) as 1 | 2, kind);
}
