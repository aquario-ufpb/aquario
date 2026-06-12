import Image from "next/image";
import { cn } from "@/lib/client/utils";

type FlagProps = {
  /** Código do flagcdn (ex.: "br", "gb-sct"). */
  code: string;
  /** Nome usado no alt. */
  name: string;
  className?: string;
  /** Largura renderizada em px (a altura segue a proporção 4:3). */
  width?: number;
};

/**
 * Bandeira de país via flagcdn.com (imagens públicas, sempre nítidas).
 * Usa a versão 2x para telas retina.
 */
export function Flag({ code, name, className, width = 32 }: FlagProps) {
  const height = Math.round((width * 3) / 4);
  const pxWidth = width * 2;

  return (
    <Image
      src={`https://flagcdn.com/w${pxWidth <= 40 ? 40 : pxWidth <= 80 ? 80 : 160}/${code}.png`}
      alt={`Bandeira de ${name}`}
      width={width}
      height={height}
      className={cn(
        "inline-block rounded-sm object-cover shadow-sm ring-1 ring-black/5",
        className
      )}
      unoptimized
    />
  );
}
