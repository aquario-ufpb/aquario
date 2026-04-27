import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type DisciplinesIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function DisciplinesIllustration({
  appearance = "underwater",
}: DisciplinesIllustrationProps) {
  const isSurface = appearance === "surface";
  const classNames = isSurface
    ? ["bg-blue-300", "bg-slate-200", "bg-cyan-200", "bg-sky-100"]
    : ["bg-blue-400/55", "bg-sky-300/25", "bg-cyan-300/40", "bg-sky-300/20"];

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className={cn("h-9 w-9 rounded-xl", isSurface ? "bg-blue-100" : "bg-sky-100/90")} />
        <div className="flex-1 space-y-2">
          <div
            className={cn("h-2.5 w-3/4 rounded-full", isSurface ? "bg-blue-200" : "bg-sky-100/65")}
          />
          <div
            className={cn("h-2 w-1/2 rounded-full", isSurface ? "bg-slate-200" : "bg-sky-200/30")}
          />
        </div>
      </div>
      <div className="space-y-2">
        {classNames.map((className, index) => (
          <div
            key={`${className}-${index}`}
            className="grid grid-cols-[3rem_1fr] items-center gap-3"
          >
            <div
              className={cn(
                "text-[10px] font-semibold",
                isSurface ? "text-slate-500" : "text-sky-100/60"
              )}
            >{`${8 + index * 2}:00`}</div>
            <div className={`h-7 rounded-lg ${className}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
