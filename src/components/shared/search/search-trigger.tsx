"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 rounded-full"
      aria-label="Pesquisar (Ctrl+K)"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
