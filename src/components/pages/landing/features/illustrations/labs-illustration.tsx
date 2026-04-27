"use client";

import { cn } from "@/lib/client/utils";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureIllustrationAppearance } from "../types";

type LabsIllustrationProps = {
  labs: Entidade[];
  appearance?: FeatureIllustrationAppearance;
};

type LabSource = {
  id: string;
  name: string;
  imagePath?: string;
};

const FALLBACK_LABS: LabSource[] = [
  { id: "lab-01", name: "Lab 01" },
  { id: "lab-02", name: "Lab 02" },
  { id: "lab-03", name: "Lab 03" },
  { id: "lab-04", name: "Lab 04" },
  { id: "lab-05", name: "Lab 05" },
];

function getLabLabel(name: string): string {
  return name.split(" ").slice(0, 2).join(" ");
}

function getLabInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shuffleLabs(labs: LabSource[]): LabSource[] {
  const shuffled = [...labs];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getWindowedLabs(labs: LabSource[], startIndex: number, count: number): LabSource[] {
  if (labs.length === 0) {
    return [];
  }

  return Array.from({ length: Math.min(count, labs.length) }, (_, offset) => {
    return labs[(startIndex + offset) % labs.length];
  });
}

export function LabsIllustration({ labs, appearance = "underwater" }: LabsIllustrationProps) {
  const isSurface = appearance === "surface";
  const shouldReduceMotion = useReducedMotion();
  const labSource = useMemo<LabSource[]>(
    () =>
      labs.length > 0
        ? labs.map(lab => ({ id: lab.id, name: lab.name, imagePath: lab.imagePath }))
        : FALLBACK_LABS,
    [labs]
  );
  const [labOrder, setLabOrder] = useState<LabSource[]>(labSource);
  const [startIndex, setStartIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [canTransition, setCanTransition] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLabOrder(shouldReduceMotion ? labSource : shuffleLabs(labSource));
    setStartIndex(0);
    setIsSliding(false);
    setCanTransition(true);
  }, [labSource, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || labOrder.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setCanTransition(true);
      setIsSliding(true);

      timeoutRef.current = window.setTimeout(() => {
        setCanTransition(false);
        setStartIndex(currentIndex => {
          const nextIndex = currentIndex + 1;

          if (nextIndex >= labOrder.length) {
            setLabOrder(currentOrder => shuffleLabs(currentOrder));
            return 0;
          }

          return nextIndex;
        });
        setIsSliding(false);
        timeoutRef.current = null;

        window.requestAnimationFrame(() => {
          setCanTransition(true);
        });
      }, 420);
    }, 1800);

    return () => {
      window.clearInterval(interval);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [labOrder.length, shouldReduceMotion]);

  const visibleLabs = getWindowedLabs(labOrder, startIndex, shouldReduceMotion ? 3 : 4);

  return (
    <div
      className={cn(
        "relative h-48 overflow-hidden rounded-2xl border p-4 shadow-inner",
        isSurface ? "border-slate-200 bg-slate-50" : "border-sky-200/15 bg-sky-900/50"
      )}
    >
      <div className="absolute inset-x-4 bottom-4 top-4 overflow-hidden">
        <div
          className={cn(
            "space-y-2",
            canTransition ? "transition-transform duration-500 ease-in-out" : ""
          )}
          style={{ transform: isSliding ? "translateY(-3.5rem)" : "translateY(0)" }}
        >
          {visibleLabs.map((lab, index) => {
            const isActive = (isSliding ? index === 2 : index === 1) || visibleLabs.length === 1;

            return (
              <div
                key={lab.id}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-2xl border px-3 transition-colors duration-300",
                  isActive ? "opacity-100" : "opacity-65",
                  isSurface
                    ? isActive
                      ? "border-slate-300 bg-white text-blue-950"
                      : "border-slate-200 bg-white/75 text-slate-600"
                    : isActive
                      ? "border-sky-100/20 bg-white/10 text-sky-50"
                      : "border-sky-100/10 bg-sky-300/10 text-sky-100/75"
                )}
                title={lab.name}
              >
                <div
                  className={cn(
                    "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[9px] font-bold",
                    isSurface
                      ? isActive
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-100 text-slate-500"
                      : isActive
                        ? "bg-sky-100/15 text-sky-50"
                        : "bg-white/5 text-sky-100"
                  )}
                >
                  {lab.imagePath ? (
                    <Image
                      src={lab.imagePath}
                      alt=""
                      fill
                      sizes="32px"
                      loading="eager"
                      className="object-cover"
                    />
                  ) : (
                    getLabInitials(lab.name)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold leading-tight">
                    {getLabLabel(lab.name)}
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    {[0, 1, 2].map(signal => (
                      <span
                        key={signal}
                        className={cn(
                          "h-1 rounded-full transition-all duration-500",
                          signal === 0 ? "w-8" : signal === 1 ? "w-5" : "w-3",
                          isSurface
                            ? isActive
                              ? "bg-blue-400"
                              : "bg-slate-300"
                            : isActive
                              ? "bg-cyan-200"
                              : "bg-sky-200/25"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isSurface
                      ? isActive
                        ? "bg-slate-500"
                        : "bg-slate-300"
                      : isActive
                        ? "bg-sky-100"
                        : "bg-sky-200/30"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
