/** @jest-environment node */
import { normalizeCurriculumCode } from "../curriculum-code";
it.each(["492016 - 2016.2", "492016–2016.2", " 492016 — 2016.2 "])(
  "extracts the registry from the SIGAA label %s",
  value => {
    expect(normalizeCurriculumCode(value)).toBe("492016");
  }
);
it.each(["492016", "2010-A", "492016 - OUTRO", "492016 - 2016.9"])(
  "does not infer a registry from a different code format %s",
  value => {
    expect(normalizeCurriculumCode(value)).toBe(value);
  }
);
