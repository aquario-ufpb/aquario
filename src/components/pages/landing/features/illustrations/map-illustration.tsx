import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type MapIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function MapIllustration({ appearance = "underwater" }: MapIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="grid grid-cols-4 gap-2">
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-100" : "bg-sky-300/10")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-blue-100" : "bg-sky-300/30")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-200/70" : "bg-sky-300/15")} />
        <div
          className={cn("col-span-2 h-10 rounded-lg", isSurface ? "bg-blue-200" : "bg-blue-400/50")}
        />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-100" : "bg-sky-300/15")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-sky-100" : "bg-sky-300/25")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-100" : "bg-sky-300/10")} />
        <div className={cn("h-10 rounded-lg", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
        <div
          className={cn("col-span-2 h-10 rounded-lg", isSurface ? "bg-cyan-100" : "bg-cyan-300/35")}
        />
      </div>
    </div>
  );
}
