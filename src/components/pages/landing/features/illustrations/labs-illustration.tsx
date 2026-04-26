import type { Entidade } from "@/lib/shared/types/entidade.types";
import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type LabsIllustrationProps = {
  labs: Entidade[];
  appearance?: FeatureIllustrationAppearance;
};

export function LabsIllustration({ labs, appearance = "underwater" }: LabsIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="grid grid-cols-4 gap-2">
        {labs.length > 0
          ? labs.map((lab, index) => (
              <div
                key={lab.id}
                className={`flex min-h-12 items-center justify-center rounded-lg border px-2 text-center text-[10px] font-semibold leading-tight transition-colors hover:bg-sky-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                  index === 0
                    ? isSurface
                      ? "col-span-2 border-blue-200 bg-blue-100 text-blue-950"
                      : "col-span-2 border-sky-200/10 bg-blue-400/40 text-sky-50"
                    : index === 2
                      ? isSurface
                        ? "row-span-2 border-cyan-200 bg-cyan-100 text-blue-950"
                        : "row-span-2 border-sky-200/10 bg-cyan-300/25 text-sky-50"
                      : isSurface
                        ? "border-slate-200 bg-white text-blue-950"
                        : "border-sky-200/10 bg-sky-300/15 text-sky-50"
                }`}
                title={lab.name}
              >
                {lab.name.split(" ").slice(0, 2).join(" ")}
              </div>
            ))
          : ["Lab 01", "Lab 02", "Lab 03", "Lab 04"].map(lab => (
              <div
                key={lab}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-lg px-2 text-[10px] font-semibold",
                  isSurface
                    ? "bg-white text-slate-500 ring-1 ring-slate-200"
                    : "bg-sky-300/15 text-sky-100/70"
                )}
              >
                {lab}
              </div>
            ))}
        <div className={cn("h-12 rounded-lg", isSurface ? "bg-slate-100" : "bg-sky-300/10")} />
        <div className={cn("h-12 rounded-lg", isSurface ? "bg-slate-200" : "bg-sky-300/20")} />
      </div>
    </div>
  );
}
