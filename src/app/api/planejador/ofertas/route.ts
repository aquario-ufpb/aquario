import { NextResponse } from "next/server";
import { getPublicSigaaCourses } from "@/lib/server/services/planner/sigaa-offerings";
import { publicCourseIdSchema, semesterSchema } from "@/lib/shared/planner/types";

import {
  getLimitedPublicSigaaOfferings,
  OfferingQueueFullError,
} from "@/lib/server/services/planner/offerings-batch";
import { offeringRequestPolicy } from "@/lib/server/services/planner/offering-request-policy";

export const maxDuration = 60;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const courseId = params.get("curso");
  try {
    const policy = await offeringRequestPolicy(request, params.get("atualizar") === "1");
    if (policy.response) {
      return policy.response;
    }
    if (!courseId) {
      return NextResponse.json({ courses: await getPublicSigaaCourses() });
    }
    const course = publicCourseIdSchema.safeParse(courseId),
      semester = semesterSchema.safeParse(params.get("semestre"));
    if (!course.success || !semester.success) {
      return NextResponse.json({ message: "Curso ou semestre inválido." }, { status: 400 });
    }
    return NextResponse.json(
      await getLimitedPublicSigaaOfferings(course.data, semester.data, policy.refresh)
    );
  } catch (error) {
    if (error instanceof OfferingQueueFullError) {
      return NextResponse.json(
        { message: "Consulta de oferta ocupada. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": "30" } }
      );
    }
    return NextResponse.json(
      {
        message:
          "Não foi possível consultar a oferta do SIGAA. Tente novamente; você pode continuar com turmas já carregadas ou personalizadas.",
      },
      { status: 502 }
    );
  }
}
