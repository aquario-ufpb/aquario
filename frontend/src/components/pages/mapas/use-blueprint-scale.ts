"use client";

import { useEffect, useState } from "react";
import type { Floor } from "@/lib/mapas/types";
import { getBlueprintScale } from "./blueprint-utils";

export function useBlueprintScale(
  blueprint: Floor["blueprint"],
  options?: {
    compact?: boolean;
  }
) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return getBlueprintScale(blueprint, windowWidth, options);
}
