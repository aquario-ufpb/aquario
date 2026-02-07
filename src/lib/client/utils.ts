import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NORMAL_COLORS = ["0a5b83", "1c799f", "69d2e7"];
const FACADE_COLOR = "f1f4dc";

export function getDefaultAvatarUrl(seed: string, eFacade = false): string {
  const color = eFacade ? FACADE_COLOR : NORMAL_COLORS[seed.charCodeAt(0) % NORMAL_COLORS.length];

  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&shapeColor=${color}`;
}
