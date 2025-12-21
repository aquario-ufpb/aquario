"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/shared/utils";
import { useTheme } from "next-themes";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  // Cores do projeto Aquario - Dark mode
  const darkGradientColor = "#458FB5"; // Air Force blue
  const darkConicColor = "from-[#80B1E2]"; // Ruddy Blue

  // Cores do projeto Aquario - Light mode
  const lightGradientColor = "#0C4A6E"; // Indigo dye
  const lightConicColor = "from-[#4871B3]"; // True Blue

  const gradientColor = isDark ? darkGradientColor : lightGradientColor;
  const conicColor = isDark ? darkConicColor : lightConicColor;

  // Default to dark mode on first render to prevent hydration mismatch
  const gradientColorFinal = mounted ? gradientColor : darkGradientColor;
  const conicColorFinal = mounted ? conicColor : darkConicColor;

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden w-full rounded-md z-0",
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 ">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]",
            conicColorFinal
          )}
        ></motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent text-white [--conic-position:from_290deg_at_center_top]",
            conicColorFinal
          )}
        ></motion.div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full blur-2xl"
          style={{ backgroundColor: gradientColorFinal, opacity: 0.5 }}
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem]"
          style={{ backgroundColor: gradientColorFinal }}
        ></motion.div>

        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-36 w-[30rem] -translate-y-1/2 rounded-full blur-3xl opacity-50"
          style={{ backgroundColor: gradientColorFinal }}
        ></motion.div>
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};
