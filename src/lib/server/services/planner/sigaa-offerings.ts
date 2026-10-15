import "server-only";
import { unstable_cache } from "next/cache";
import { getContainer } from "@/lib/server/container";
import { createPublicOfferingCache } from "./public-offering-cache";
import { publicCourseIdSchema, semesterSchema } from "@/lib/shared/planner/types";
import {
  parseCourseOfferings,
  parsePublicCourses,
  parseSearchForm,
} from "./sigaa-offerings-parser";

const ORIGIN = "https://sigaa.ufpb.br";
async function read(response: Response) {
  if (!response.ok || new URL(response.url || ORIGIN).origin !== ORIGIN) {
    throw new Error("SIGAA_UNAVAILABLE");
  }
  if (Number(response.headers.get("content-length")) > 5000000) {
    throw new Error("SIGAA_RESPONSE_TOO_LARGE");
  }
  const html = await response.text();
  if (html.length > 5000000) {
    throw new Error("SIGAA_RESPONSE_TOO_LARGE");
  }
  return html;
}
export const getPublicSigaaCourses = unstable_cache(
  async () => {
    const response = await fetch(`${ORIGIN}/sigaa/public/curso/lista.jsf?nivel=G`, {
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
    return parsePublicCourses(await read(response));
  },
  ["planner-sigaa-courses-v1"],
  { revalidate: 86400 }
);

async function fetchPublicSigaaOfferings(courseId: string, semester: string) {
  publicCourseIdSchema.parse(courseId);
  semesterSchema.parse(semester);
  const course = (await getPublicSigaaCourses()).find(item => item.id === courseId);
  if (!course) {
    throw new Error("SIGAA_COURSE_NOT_FOUND");
  }
  const url = `${ORIGIN}/sigaa/public/curso/turmas.jsf?id=${courseId}&lc=pt_BR`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), cache: "no-store" });
  const form = parseSearchForm(await read(response));
  const action = new URL(form.action, ORIGIN);
  if (action.origin !== ORIGIN || !action.pathname.startsWith("/sigaa/public/curso/turmas.jsf")) {
    throw new Error("SIGAA_FORM_ACTION_INVALID");
  }
  const [year, period] = semester.split(".");
  form.fields.set("form:inputAno", year);
  form.fields.set("form:inputPeriodo", period);
  // Anonymous JSF cookies belong only to this query, never to a student session.
  const cookie = response.headers
    .getSetCookie()
    .map(value => value.split(";")[0])
    .join("; ");
  const result = await fetch(action, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: form.fields,
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  return parseCourseOfferings(await read(result), course, semester, new Date().toISOString());
}
let offeringCache: ReturnType<typeof createPublicOfferingCache> | undefined;
function cache() {
  offeringCache ??= createPublicOfferingCache(
    getContainer().publicOfferingCacheRepository,
    fetchPublicSigaaOfferings
  );
  return offeringCache;
}
export function getPublicSigaaOfferings(courseId: string, semester: string, refresh = false) {
  publicCourseIdSchema.parse(courseId);
  semesterSchema.parse(semester);
  return cache().get(courseId, semester, refresh);
}
export function getCachedPublicSigaaOfferings(semester: string, courseIds: string[]) {
  return cache().snapshot(semester, courseIds);
}
