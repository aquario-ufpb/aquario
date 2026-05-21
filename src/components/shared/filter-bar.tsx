"use client";

import { LayoutGroup, motion } from "motion/react";

const PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.6,
};

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
    <LayoutGroup id="filter-bar">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => {
          const isActive = active === filter.id;
          return (
            <button
              key={filter.id ?? "all"}
              type="button"
              onClick={() => onChange(filter.id)}
              aria-pressed={isActive}
              className={`relative inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                isActive
                  ? "text-white"
                  : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="filter-bar-active-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-aquario-primary"
                  transition={PILL_TRANSITION}
                  aria-hidden
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
