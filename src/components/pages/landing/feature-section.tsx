import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
      className={`h-full border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-300/30 ${containerClassName || ""}`}
    >
      <CardContent className="flex items-center gap-5 overflow-hidden p-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3
              className={`font-display text-xl font-bold ${isDark ? "text-white" : "text-aquario-primary"}`}
            >
              {title}
            </h3>
            {badgeText && <Badge className={badgeClassName}>{badgeText}</Badge>}
          </div>
          <p
            className={`mb-5 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {subtitle}
          </p>
          <Button
            asChild
            variant="outline"
            {...buttonProps}
            className={
              isDark
                ? "rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                : "rounded-full border-blue-900/20 bg-white text-blue-900 hover:bg-blue-50"
            }
          >
            <Link href={buttonUrl}>{buttonText}</Link>
          </Button>
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
