"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = (resolvedTheme || theme) === "dark";

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  // Cores adaptadas para o projeto Aquário - modo claro e escuro
  // Usando as cores azuis do projeto (aquario-primary: hsl(212, 77%, 24%))
  const movingMap: Record<Direction, string> = isDark
    ? {
        TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(212, 70%, 60%) 0%, rgba(96, 159, 192, 0) 100%)",
        LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(212, 70%, 60%) 0%, rgba(96, 159, 192, 0) 100%)",
        BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(212, 70%, 60%) 0%, rgba(96, 159, 192, 0) 100%)",
        RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(212, 70%, 60%) 0%, rgba(96, 159, 192, 0) 100%)",
      }
    : {
        TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(212, 77%, 24%) 0%, rgba(12, 69, 103, 0) 100%)",
        LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(212, 77%, 24%) 0%, rgba(12, 69, 103, 0) 100%)",
        BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(212, 77%, 24%) 0%, rgba(12, 69, 103, 0) 100%)",
        RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(212, 77%, 24%) 0%, rgba(12, 69, 103, 0) 100%)",
      };

  // Highlight color adaptado para o projeto Aquário
  const highlight = isDark
    ? "radial-gradient(75% 181.16% at 50% 50%, hsl(212, 70%, 60%) 0%, rgba(96, 159, 192, 0) 100%)"
    : "radial-gradient(75% 181.16% at 50% 50%, hsl(212, 77%, 24%) 0%, rgba(12, 69, 103, 0) 100%)";

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, clockwise]);

  if (!mounted) {
    return null;
  }

  return (
    <Tag
      onMouseEnter={(event: React.MouseEvent<HTMLDivElement>) => {
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto z-10 px-4 py-2 rounded-[inherit]",
          isDark
            ? "bg-black/80 text-white"
            : "bg-white text-aquario-primary",
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]"
        )}
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? highlight : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div
        className={cn(
          "absolute z-1 flex-none inset-[2px] rounded-[100px]",
          isDark ? "bg-black" : "bg-white"
        )}
      />
    </Tag>
  );
}
