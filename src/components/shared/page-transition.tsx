"use client";

import { motion, useReducedMotion } from "motion/react";

const TRANSITION = {
  duration: 0.25,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : TRANSITION}
    >
      {children}
    </motion.div>
  );
}
