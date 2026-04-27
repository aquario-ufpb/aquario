import Link from "next/link";
import { FeatureIllustration } from "./feature-illustration";
import type { FeatureIllustrationProps, LandingFeature } from "./types";

type FeatureCardProps = LandingFeature & FeatureIllustrationProps;

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
  illustration,
  groups,
  labs,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[22rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-sky-950/35 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-sky-200/30 hover:bg-sky-950/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-aquario-primary dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-aquario-primary shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-sky-100">{description}</p>
      <FeatureIllustration variant={illustration} groups={groups} labs={labs} />
    </Link>
  );
}
