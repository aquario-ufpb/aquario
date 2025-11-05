"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

export const TextHoverEffect = ({
  text,
  duration,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  // Cores do projeto Aquario - Dark mode
  const darkGradient = [
    { offset: "0%", stopColor: "#458FB5" },   // Air Force blue
    { offset: "25%", stopColor: "#4871B3" },  // True Blue
    { offset: "50%", stopColor: "#80B1E2" },  // Ruddy Blue
    { offset: "75%", stopColor: "#CFF0FF" },  // Columbia blue
    { offset: "100%", stopColor: "#458FB5" }, // Air Force blue
  ];

  // Cores do projeto Aquario - Light mode
  const lightGradient = [
    { offset: "0%", stopColor: "#0C4A6E" },   // Indigo dye
    { offset: "25%", stopColor: "#458FB5" },  // Air Force blue
    { offset: "50%", stopColor: "#4871B3" },  // True Blue
    { offset: "75%", stopColor: "#80B1E2" },  // Ruddy Blue
    { offset: "100%", stopColor: "#0C4A6E" }, // Indigo dye
  ];

  const gradientColors = isDark ? darkGradient : lightGradient;

  // Cores do stroke base (sem hover)
  const baseStrokeColor = isDark ? "#458FB5" : "#0C4A6E"; // Azul médio no escuro, azul escuro no claro

  if (!mounted) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          cx="50%"
          cy="50%"
          r="25%"
        >
          {hovered && gradientColors.map((color, index) => (
            <stop key={index} offset={color.offset} stopColor={color.stopColor} />
          ))}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={baseStrokeColor}
        className="font-sans text-7xl font-bold"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={baseStrokeColor}
        className="font-sans text-7xl font-bold"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000, opacity: 0 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
          opacity: 0,
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#textGradient)"
        mask="url(#textMask)"
        className="font-sans text-7xl font-bold"
      >
        {text}
      </text>
    </svg>
  );
};

