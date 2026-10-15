import type { OfferingResponse } from "@/lib/shared/planner/types";
export type IPublicOfferingCacheRepository = {
  findFresh(semester: string, courseIds: string[], since: Date): Promise<OfferingResponse[]>;
  save(semester: string, data: OfferingResponse): Promise<void>;
};
