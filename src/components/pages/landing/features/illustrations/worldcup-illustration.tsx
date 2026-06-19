import { cn } from "@/lib/client/utils";
import type { FeatureIllustrationAppearance } from "../types";

type WorldCupIllustrationProps = {
  appearance?: FeatureIllustrationAppearance;
};

export function WorldCupIllustration({ appearance = "underwater" }: WorldCupIllustrationProps) {
  const isSurface = appearance === "surface";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      {/* "Chaveamento" estilizado da copa */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                "h-3 w-12 rounded-full",
                i % 2 === 0
                  ? isSurface
                    ? "bg-blue-300"
                    : "bg-blue-400/60"
                  : isSurface
                    ? "bg-slate-200"
                    : "bg-sky-300/20"
              )}
            />
          ))}
        </div>

        {/* Troféu central */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isSurface ? "bg-amber-100" : "bg-amber-300/20"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn("h-6 w-6", isSurface ? "text-amber-500" : "text-amber-300")}
            aria-hidden="true"
          >
            <path
              d="M6 4h12v3a6 6 0 0 1-12 0V4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M6 5H3.5v1.5A3.5 3.5 0 0 0 6 9.85M18 5h2.5v1.5A3.5 3.5 0 0 1 18 9.85M12 13v3m-3 4h6m-5 0 .5-2.2h3L14 20"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                "h-3 w-12 rounded-full",
                i % 2 === 1
                  ? isSurface
                    ? "bg-emerald-300"
                    : "bg-emerald-400/60"
                  : isSurface
                    ? "bg-slate-200"
                    : "bg-sky-300/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* "Bandeirinhas" de festa */}
      <div className="mt-4 flex items-center justify-between gap-1">
        {[
          "bg-emerald-400/70",
          "bg-amber-400/70",
          "bg-sky-400/70",
          "bg-blue-400/70",
          "bg-emerald-400/70",
          "bg-amber-400/70",
          "bg-sky-400/70",
        ].map((color, i) => (
          <div
            key={i}
            className={cn("h-3 w-3", color)}
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
        ))}
      </div>
    </div>
  );
}
