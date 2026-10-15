"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { PublicCourse } from "@/lib/shared/planner/types";

export function CoursePicker({
  courses,
  value,
  onChange,
  label,
}: {
  courses: PublicCourse[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = courses.find(course => course.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          variant="outline"
          className="w-full justify-between gap-2 font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.name} · ${selected.campus}` : "Buscar curso e campus"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
      >
        <Command>
          <CommandInput placeholder="Nome do curso ou campus…" />
          <CommandList>
            <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
            <CommandGroup>
              {courses.map(course => (
                <CommandItem
                  key={course.id}
                  value={`${course.name} ${course.campus} ${course.modality} ${course.id}`}
                  onSelect={() => {
                    onChange(course.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 size-4 shrink-0 ${value === course.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="min-w-0">
                    <span className="block">{course.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {course.campus} · {course.modality}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
