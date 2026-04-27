import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type StatusIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function StatusIllustration({ appearance = "underwater" }: StatusIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div
            className={cn("h-2.5 w-24 rounded-full", isSurface ? "bg-slate-300" : "bg-sky-100/55")}
          />
          <div
            className={cn(
              "mt-2 h-2 w-16 rounded-full",
              isSurface ? "bg-slate-200" : "bg-sky-200/25"
            )}
          />
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isSurface ? "bg-emerald-100" : "bg-emerald-300/20"
          )}
        >
          <div
            className={cn("h-4 w-4 rounded-full", isSurface ? "bg-emerald-500" : "bg-emerald-300")}
          />
        </div>
      </div>
      <div className="grid grid-cols-12 items-end gap-1">
        {[35, 45, 28, 62, 48, 72, 40, 58, 32, 52, 44, 66].map(height => (
          <div
            key={height}
            className={cn("rounded-full", isSurface ? "bg-blue-200" : "bg-sky-300/25")}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
    </div>
  );
}
