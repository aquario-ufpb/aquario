import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type GuidesIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function GuidesIllustration({ appearance = "underwater" }: GuidesIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="space-y-3">
        {["Guia do Calouro", "Manual de Laboratórios", "Dicas do Curso"].map(item => (
          <div
            key={item}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3",
              isSurface ? "bg-white ring-1 ring-slate-200" : "bg-sky-950/40"
            )}
          >
            <div
              className={cn("h-8 w-8 rounded-lg", isSurface ? "bg-blue-100" : "bg-sky-100/80")}
            />
            <div className="flex-1 space-y-2">
              <div
                className={cn("h-2.5 rounded-full", isSurface ? "bg-blue-200" : "bg-sky-100/55")}
              />
              <div
                className={cn(
                  "h-2 w-2/3 rounded-full",
                  isSurface ? "bg-slate-200" : "bg-sky-200/25"
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
