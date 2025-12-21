import React, { ReactNode } from "react";
import Link from "next/link";

type LinkHoverProps = {
  href: string;
  children: ReactNode;
};

export default function LinkHover({ href, children }: LinkHoverProps) {
  return (
    <Link
      href={href}
      className="relative text-sm dark:text-dark-text hover:text-blue-500 group transition duration-300"
    >
      {children}
      <span
        className="block absolute left-1/2 transform -translate-x-1/2 w-0 group-hover:w-full transition-all
      duration-300 h-0.5 bg-blue-500 dark:bg-white"
      ></span>
    </Link>
  );
}
