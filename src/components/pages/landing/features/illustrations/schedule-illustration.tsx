import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type ScheduleIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function ScheduleIllustration({ appearance = "underwater" }: ScheduleIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="mb-3 grid grid-cols-5 gap-3">
        {["seg", "ter", "qua", "qui", "sex"].map(day => (
          <div
            key={day}
            className={cn(
              "mx-auto h-2 w-2 rounded-full",
              isSurface ? "bg-blue-300" : "bg-sky-200/50"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-200" : "bg-sky-300/15")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-blue-300" : "bg-blue-400/60")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-100" : "bg-sky-300/15")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-sky-100" : "bg-sky-300/25")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-100" : "bg-sky-300/10")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-cyan-200" : "bg-cyan-300/45")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
        <div className={cn("h-8 rounded-md", isSurface ? "bg-blue-200" : "bg-blue-300/50")} />
      </div>
    </div>
  );
}
