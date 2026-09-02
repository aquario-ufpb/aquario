import { describe, expect, it } from "vitest";
import { onboardingPatchSchema } from "../usuarios";

describe("onboardingPatchSchema", () => {
  it("accepts the V2 policy and SIGAA step state", () => {
    expect(
      onboardingPatchSchema.parse({
        flowVersion: 2,
        sigaa: { skippedAt: "2026-08-23T12:00:00.000Z" },
      })
    ).toEqual({
      flowVersion: 2,
      sigaa: { skippedAt: "2026-08-23T12:00:00.000Z" },
    });
  });

  it("rejects unsupported onboarding policy versions", () => {
    expect(() => onboardingPatchSchema.parse({ flowVersion: 3 })).toThrow();
  });
});
