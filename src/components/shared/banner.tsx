"use client";

import React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";

type BannerProps = {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  showButton?: boolean;
};

const Banner: React.FC<BannerProps> = ({
  title,
  description,
  buttonText,
  buttonHref,
  showButton = true,
}) => {
  const { theme } = useTheme();

  const iconSrc = theme === "dark" ? "plus_Dark.png" : "plus.png";

  return (
    <div className="p-12 w-full">
      <div className="text-center">
        <h2 className="text-5xl font-inter text-neutral-800 dark:text-neutral-100 w-full max-w-[760px] mx-auto">
          {title}
        </h2>
        <p className="pb-3 text-xl pt-2 text-neutral-800 dark:text-neutral-300 mt-2 max-w-[700px] mx-auto">
          {description}
        </p>
        {showButton && buttonText && buttonHref && (
          <div className="flex justify-center">
            <Link href={buttonHref} passHref>
              <button className="mt-4 bg-neutral-800 dark:bg-neutral-100 rounded-full text-white dark:text-neutral-900 text-sm px-4 py-2 hover:bg-neutral-600 dark:hover:bg-neutral-200 transition-colors flex items-center">
                <Image
                  className="w-5 h-5 mr-2"
                  src={`/${iconSrc}`}
                  alt="icon-plus"
                  width={20}
                  height={20}
                />
                {buttonText}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Banner;
