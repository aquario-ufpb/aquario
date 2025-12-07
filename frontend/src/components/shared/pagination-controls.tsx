"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemLabel: string; // e.g., "usuário" or "entidade"
  itemLabelPlural: string; // e.g., "usuários" or "entidades"
  totalItemsLabel?: string; // Optional: total items from unfiltered list
  showTotalFromUnfiltered?: boolean; // Whether to show "de X total" when filtered
};

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel,
  itemLabelPlural,
  totalItemsLabel,
  showTotalFromUnfiltered = false,
}: PaginationControlsProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Itens por página:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={value => {
            onItemsPerPageChange(Number(value));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages} ({totalItems}{" "}
          {totalItems === 1 ? itemLabel : itemLabelPlural}
          {showTotalFromUnfiltered && totalItemsLabel && ` de ${totalItemsLabel} total`})
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

