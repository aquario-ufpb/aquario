import { cn } from "@/lib/client/utils";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import Image from "next/image";
import type { FeatureIllustrationAppearance } from "../types";

type GroupsIllustrationProps = {
  groups: Entidade[];
  appearance?: FeatureIllustrationAppearance;
};

export function GroupsIllustration({ groups, appearance = "underwater" }: GroupsIllustrationProps) {
  const isSurface = appearance === "surface";
  const uniqueGroups = Array.from(
    new Map(groups.map(entidade => [entidade.id, entidade])).values()
  );
  const rowRepeats = ["one", "two", "three", "four"];
  const marqueeGroups = rowRepeats.flatMap(repeat =>
    uniqueGroups.map(entidade => ({ entidade, repeat }))
  );
  const fallbackGroups = [
    "G1-one",
    "G2-one",
    "G3-one",
    "G4-one",
    "G1-two",
    "G2-two",
    "G3-two",
    "G4-two",
    "G1-three",
    "G2-three",
    "G3-three",
    "G4-three",
  ];

  return (
    <div
      className={cn(
        "relative h-32 overflow-hidden rounded-2xl border shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex min-w-max animate-group-marquee group-hover:[animation-play-state:paused]">
          {["first", "second"].map(set => (
            <div key={set} className="flex shrink-0 gap-4 pr-4">
              {marqueeGroups.length > 0
                ? marqueeGroups.map(({ entidade, repeat }) => (
                    <div
                      key={`${set}-${entidade.id}-${repeat}`}
                      title={entidade.name}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sky-200/20 bg-white p-2 shadow-lg ring-4 ring-sky-900/80"
                    >
                      <Image
                        src={entidade.imagePath}
                        alt={`Logo de ${entidade.name}`}
                        width={56}
                        height={56}
                        className="h-full w-full rounded-full object-contain"
                      />
                    </div>
                  ))
                : fallbackGroups.map(group => (
                    <div
                      key={`${set}-${group}`}
                      className="h-16 w-16 shrink-0 rounded-full bg-sky-100/80 ring-4 ring-sky-900/80"
                    />
                  ))}
            </div>
          ))}
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r to-transparent",
          isSurface ? "from-slate-50" : "from-sky-900/95"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent",
          isSurface ? "from-slate-50" : "from-sky-900/95"
        )}
      />
    </div>
  );
}
