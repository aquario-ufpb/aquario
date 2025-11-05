"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

// Interface defining the props for the ProfileComponent!
type HeaderProps = {
  academicCenter: string;
  courses: string[];
  currentCourse: string;
  onCourseChange?: (course: string) => void;
};

function GradientHeaderComponent({ courses, currentCourse, onCourseChange }: HeaderProps) {
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
      <div className="pl-[24px] text-lg flex" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-lg hover:text-a transition-colors">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 px-3 rounded-full hover:bg-blue-200/50"
            >
              <span className="text-lg">{selectedCourse}</span> <ChevronDown className="w-6 h-6" />
            </Button>
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
  );
}

export default GradientHeaderComponent;
