import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export type FeatureSectionProps = {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  imageSrc?: string;
  imageAlt?: string;
  badgeText?: string;
  badgeClassName?: string;
  isDark?: boolean;
  children?: ReactNode;
  buttonProps?: React.ComponentProps<typeof Button>;
  containerClassName?: string;
  carousel?: ReactNode;
};

export function FeatureSection({
  title,
  subtitle,
  buttonText,
  buttonUrl,
  imageSrc,
  imageAlt,
  badgeText,
  badgeClassName,
  isDark,
  children,
  buttonProps,
  containerClassName,
  carousel,
}: FeatureSectionProps) {
  return (
    <Card
      className={`h-full hover:shadow-lg transition-shadow cursor-pointer pointer-events-auto ${
        isDark
          ? "bg-white/10 border-white/20 hover:bg-white/15"
          : "bg-white/60 border-blue-200 hover:bg-white/80"
      } ${containerClassName || ""}`}
    >
      <CardContent className="flex items-center gap-4 overflow-hidden p-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3
              className={`font-display text-xl font-bold ${
                isDark ? "text-white" : "text-aquario-primary"
              }`}
            >
              {title}
            </h3>
            {badgeText && <Badge className={badgeClassName}>{badgeText}</Badge>}
          </div>
          <p className={`text-sm mb-4 ${isDark ? "text-white/80" : "text-slate-700"}`}>
            {subtitle}
          </p>
          <Link href={buttonUrl} className="block">
            <Button variant="outline" {...buttonProps}>
              {buttonText}
            </Button>
          </Link>
          {children}
          {carousel && <div className="w-full min-w-0 max-w-full overflow-hidden">{carousel}</div>}
        </div>
        {imageSrc && (
          <div className="flex-shrink-0 hidden sm:block">
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={220}
              height={120}
              className="object-contain rounded-lg shadow-md"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
