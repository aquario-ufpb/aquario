import { NextResponse } from "next/server";
import { z } from "zod";
import { draftSchema } from "@/lib/shared/planner/types";

export const planRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    draft: draftSchema,
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .strict();
export const privatePlanResponse = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
export async function readPlanRequest(request: Request) {
  if (Number(request.headers.get("content-length")) > 1500000) {
    throw new Error("PLAN_TOO_LARGE");
  }
  const text = await request.text();
  if (text.length > 1500000) {
    throw new Error("PLAN_TOO_LARGE");
  }
  const value: unknown = JSON.parse(text);
  const queue = [{ value, depth: 0 }];
  while (queue.length) {
    const item = queue.pop();
    if (!item) {
      break;
    }
    if (item.depth > 14) {
      throw new Error("PLAN_TOO_DEEP");
    }
    if (item.value && typeof item.value === "object") {
      for (const child of Object.values(item.value)) {
        queue.push({ value: child, depth: item.depth + 1 });
      }
    }
  }
  return planRequestSchema.parse(value);
}
