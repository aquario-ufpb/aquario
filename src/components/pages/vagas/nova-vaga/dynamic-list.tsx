import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type DynamicListProps = {
  items: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
};

export function DynamicList({
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: DynamicListProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) {
                onAdd();
              }
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="flex-shrink-0 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-input bg-muted/40 text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground/60 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
