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
      {filters.map(filter => {
        const isActive = active === filter.id;
        return (
          <Button
            key={filter.id ?? "all"}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(filter.id)}
            className={
              isActive
                ? "rounded-full bg-aquario-primary text-white hover:bg-aquario-primary/90"
                : "rounded-full"
            }
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
