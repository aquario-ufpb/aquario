import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NORMAL_COLORS = ["0a5b83", "1c799f", "69d2e7"];
const FACADE_COLOR = "f1f4dc";

export function getDefaultAvatarUrl(seed: string, nome: string, eFacade = false): string {
  const color = eFacade ? FACADE_COLOR : NORMAL_COLORS[seed.charCodeAt(0) % NORMAL_COLORS.length];
  const firstName = nome.trim().split(" ")[0].toLowerCase();
  const bg = firstName.endsWith("a") ? "d1d4f9" : "b6e3f4";

  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&shapeColor=${color}&scale=70&backgroundColor=${bg}&shapeRotation=0&shapeOffsetX=0&shapeOffsetY=0`;
}
