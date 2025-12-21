"use client";

import { Button } from "@/components/ui/button";

export function FilterBar({
  filters,
  active,
  onChange,
}: {
  filters: { id: string | null; label: string }[];
  active: string | null;
  onChange: (filter: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <Button
          key={filter.id ?? "all"}
          variant={active === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(filter.id)}
          className="rounded-full"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
