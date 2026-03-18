"use client";

import { useEntidades } from "@/lib/client/hooks";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export function EntidadesCarousel({ isDark }: { isDark: boolean }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: allEntidades = [] } = useEntidades();
  const [isScrolling, setIsScrolling] = useState(false);

  // Filter and shuffle entidades for preview (excluding EMPRESA)
  const entidades = useMemo(() => {
    if (allEntidades.length === 0) {
      return [];
    }
    // Filter out EMPRESA type entidades
    const filteredData = allEntidades.filter(entidade => entidade.tipo !== "EMPRESA");
    // Randomize the order using Fisher-Yates shuffle
    const shuffled = [...filteredData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [allEntidades]);

  useEffect(() => {
    if (!scrollContainerRef.current || entidades.length === 0 || isScrolling) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollSpeed = 1.5;
    let animationFrameId: number;

    const autoScroll = () => {
      if (!isScrolling) {
        container.scrollLeft += scrollSpeed;
        // Reset halfway through the duplicated list for a seamless loop.
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [entidades.length, isScrolling]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative mt-4 w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
      onWheel={() => {
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), 2000);
      }}
      onMouseDown={() => setIsScrolling(true)}
      onMouseUp={() => setTimeout(() => setIsScrolling(false), 1000)}
      onTouchStart={() => setIsScrolling(true)}
      onTouchEnd={() => setTimeout(() => setIsScrolling(false), 1000)}
    >
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div className="flex gap-4" style={{ width: "fit-content" }}>
        {[...entidades, ...entidades].map((entidade, index) => (
          <Link
            key={`${entidade.id}-${index}`}
            href={`/entidade/${entidade.slug}`}
            className={`flex min-w-[200px] max-w-[250px] flex-shrink-0 items-center gap-3 rounded-lg border p-3 transition-colors pointer-events-auto ${
              isDark ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entidade.imagePath || ""}
              alt={entidade.name}
              className="h-12 w-12 flex-shrink-0 rounded object-contain"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {entidade.name}
              </p>
              {entidade.subtitle && (
                <p className={`truncate text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}>
                  {entidade.subtitle}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
