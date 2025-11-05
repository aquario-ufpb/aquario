"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface defining the props for the ProfileComponent!
type HeaderProps = {
  academicCenter: string;
  courses: string[];
  currentCourse: string;
  onCourseChange?: (course: string) => void;
};

function GradientHeaderComponent({
  academicCenter,
  courses,
  currentCourse,
  onCourseChange,
}: HeaderProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState(currentCourse);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    onCourseChange?.(course);
  };
  return (
    <div
      className="flex justify-start items-center w-full h-20 flex-shrink-0 mb-2"
      style={{
        background: isDark
          ? "linear-gradient(to right, #1a3a5c 0%, #0f2338 100%)"
          : "linear-gradient(to right, #DCF0FF 0%, #C8E6FA 100%)",
      }}
    >
      <div
        className="pl-[24px] text-lg flex font-sans"
        style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
      >
        <Monitor />
        <p className="text-lg pl-4 pr-4 font-sans">{academicCenter}</p>
        <div className="flex flex-col items-center justify-center">
          <div
            className="pl-4 h-[1px] w-5"
            style={{ backgroundColor: isDark ? "#C8E6FA" : "#0e3a6c" }}
          ></div>
        </div>
        <div className="pl-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-lg font-sans hover:underline">
              <div className="flex">
                {selectedCourse} <ChevronDown />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel className="text-sm">Cursos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {courses.map((course, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleCourseSelect(course)}
                  className="font-sans"
                >
                  {course}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default GradientHeaderComponent;
