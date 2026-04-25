"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";

type WaterTransitionSectionProps = {
  children: ReactNode;
};

export function WaterTransitionSection({ children }: WaterTransitionSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const waveLift = useTransform(scrollY, [180, 680], ["0px", "-140px"]);

  return (
    <section className="relative z-10 -mt-56 overflow-visible bg-sky-800 pb-20 pt-[22rem] text-white dark:bg-sky-950 md:-mt-72 md:pt-[28rem]">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 h-80 w-[200%] text-slate-50 will-change-transform dark:text-slate-950 md:h-96"
        style={shouldReduceMotion ? undefined : { y: waveLift }}
      >
        <svg
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
          className="block h-full w-full motion-safe:animate-wave-drift"
        >
          <title>Divisória em ondas</title>
          <path
            fill="currentColor"
            d="M0 0H2880V88C2760 101 2640 101 2520 88C2340 68 2160 68 1980 88C1800 108 1620 108 1440 88C1320 75 1200 75 1080 88C900 108 720 108 540 88C360 68 180 68 0 88V0Z"
          />
        </svg>
      </motion.div>

      <div className="container relative z-20 mx-auto px-4">{children}</div>
    </section>
  );
}
