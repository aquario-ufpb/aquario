"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import WaterRippleEffect from "@/components/ui/water-ripple-effect";

export function HeroSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : true;

  if (!mounted) {
    return (
      <div className="relative overflow-x-hidden overflow-y-hidden w-full h-[85vh] bg-gradient-to-r from-[#1a3a5c] to-[#0f2338] dark:from-[#1a3a5c] dark:to-[#0f2338]" />
    );
  }

  return (
    <div className="relative overflow-x-hidden overflow-y-hidden w-full h-[85vh]">
      {/* Circular gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(circle at 25% 50%, #1a3a5c 0%, #0f2338 100%)"
            : "radial-gradient(circle at 25% 50%, #DCF0FF 0%, #C8E6FA 100%)",
        }}
      />

      {/* Blur effect */}
      <div className="absolute left-0 top-0 bottom-0 w-[50%] z-0">
        <Image src="/blur.svg" alt="Blur effect" fill className="object-contain object-left" />
      </div>

      <div className="relative flex flex-col md:flex-row items-center h-full w-full max-w-7xl mx-auto px-4 md:px-8 md:pr-12 pt-24">
        {/* Fish Image - Left Side */}
        <div className="hidden md:flex flex-1 relative w-full md:w-2/3 h-full mb-8 md:mb-0 items-center justify-start">
          <div className="relative w-full h-full -ml-8 md:-ml-16">
            <div
              className="relative z-10 w-[120%] h-[120%] -ml-[10%] -mt-[10%]"
              style={{ transform: "scale(0.8) translateX(-8%) translateY(15%)" }}
            >
              <WaterRippleEffect
                imageSrc={isDark ? "/vector4.svg" : "/vector3.svg"}
                width={1632}
                height={1246}
                className="object-contain object-left"
                containerClassName="w-full h-full"
                scale={0.8}
              />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 flex flex-col items-center md:items-end justify-center space-y-4 md:pl-8 text-center md:text-right w-full">
          <h1
            className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight"
            style={{ color: isDark ? "#D0EFFF" : "#285A96" }}
          >
            <span className="block">Sobre o</span>
            <span className="block">Aquário</span>
          </h1>

          <p
            className="text-base md:text-lg leading-relaxed max-w-md"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            Um projeto open source focado em centralizar informações relevantes para os alunos do
            Centro de Informática (CI) da UFPB.
          </p>

          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="rounded-lg font-normal hover:opacity-90 transition-opacity flex items-center gap-1 px-5"
              style={{
                backgroundColor: isDark ? "#1a3a5c" : "#ffffff",
                color: isDark ? "#C8E6FA" : "#0e3a6c",
              }}
            >
              <Link
                href="https://github.com/aquario-ufpb/aquario"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-6 h-6" />
                <span className="text-2md">Contribua para o Aquário</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
