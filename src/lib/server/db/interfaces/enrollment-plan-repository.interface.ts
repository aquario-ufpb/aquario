import type { PlannerDraft, PlanSummary, SavedPlan } from "@/lib/shared/planner/types";
export type { PlanSummary, SavedPlan } from "@/lib/shared/planner/types";
export type IEnrollmentPlanRepository = {
  list(ownerId: string): Promise<PlanSummary[]>;
  find(ownerId: string, id: string): Promise<SavedPlan | null>;
  create(
    ownerId: string,
    profileCourseId: string,
    name: string,
    draft: PlannerDraft
  ): Promise<SavedPlan>;
  update(
    ownerId: string,
    id: string,
    expectedUpdatedAt: string,
    name: string,
    draft: PlannerDraft,
    profileCourseId: string
  ): Promise<SavedPlan | null>;
  delete(ownerId: string, id: string): Promise<boolean>;
};
