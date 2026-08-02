import { CurriculumIllustration } from "./illustrations/curriculum-illustration";
import { DisciplinesIllustration } from "./illustrations/disciplines-illustration";
import { GroupsIllustration } from "./illustrations/groups-illustration";
import { GuidesIllustration } from "./illustrations/guides-illustration";
import { LabsIllustration } from "./illustrations/labs-illustration";
import { MapIllustration } from "./illustrations/map-illustration";
import { ScheduleIllustration } from "./illustrations/schedule-illustration";
import { StatusIllustration } from "./illustrations/status-illustration";
import type { FeatureIllustrationProps, FeatureIllustrationVariant } from "./types";

type FeatureIllustrationDispatcherProps = FeatureIllustrationProps & {
  variant: FeatureIllustrationVariant;
};

export function FeatureIllustration({
  variant,
  groups,
  labs,
  appearance = "underwater",
}: FeatureIllustrationDispatcherProps) {
  return (
    <div className="mt-auto pt-8">
      {variant === "map" && <MapIllustration appearance={appearance} />}
      {variant === "schedule" && <ScheduleIllustration appearance={appearance} />}
      {variant === "disciplines" && <DisciplinesIllustration appearance={appearance} />}
      {variant === "status" && <StatusIllustration appearance={appearance} />}
      {variant === "curriculum" && <CurriculumIllustration appearance={appearance} />}
      {variant === "guides" && <GuidesIllustration appearance={appearance} />}
      {variant === "groups" && <GroupsIllustration groups={groups} appearance={appearance} />}
      {variant === "labs" && <LabsIllustration labs={labs} appearance={appearance} />}
    </div>
  );
}
