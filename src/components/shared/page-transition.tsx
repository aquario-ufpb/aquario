"use client";

import { motion, useReducedMotion } from "motion/react";

const TRANSITION = {
  duration: 0.25,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
