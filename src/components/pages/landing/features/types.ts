import type { Entidade } from "@/lib/shared/types/entidade.types";
import type { LucideIcon } from "lucide-react";

export type FeatureIllustrationVariant =
  | "map"
  | "schedule"
  | "disciplines"
  | "status"
  | "curriculum"
  | "guides"
  | "groups"
  | "labs";

export type FeatureIllustrationAppearance = "underwater" | "surface";

export type LandingFeature = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  illustration: FeatureIllustrationVariant;
};

export type FeatureIllustrationProps = {
  groups: Entidade[];
  labs: Entidade[];
  appearance?: FeatureIllustrationAppearance;
};
