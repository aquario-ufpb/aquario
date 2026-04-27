"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

type WaterTransitionSectionProps = {
  children: ReactNode;
};

export function WaterTransitionSection({ children }: WaterTransitionSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const waveLift = useTransform(scrollYProgress, [0, 1], ["0px", "-120px"]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mt-56 overflow-visible bg-aquario-primary pb-20 pt-[22rem] text-white dark:bg-aquario-primary md:-mt-72 md:pt-[28rem]"
    >
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
            d="M0 0H2880V104C2760 117 2640 117 2520 104C2340 84 2160 84 1980 104C1800 124 1620 124 1440 104C1320 91 1200 91 1080 104C900 124 720 124 540 104C360 84 180 84 0 104V0Z"
          />
        </svg>
      </motion.div>

      <div className="container relative z-20 mx-auto px-4">{children}</div>
    </section>
  );
}
