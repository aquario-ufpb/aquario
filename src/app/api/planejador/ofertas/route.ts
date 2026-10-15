import { NextResponse } from "next/server";
import {
  getPublicSigaaCourses,
  getPublicSigaaOfferings,
} from "@/lib/server/services/planner/sigaa-offerings";
import { publicCourseIdSchema, semesterSchema } from "@/lib/shared/planner/types";

export const maxDuration = 60;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const courseId = params.get("curso");
  try {
    if (!courseId) {
      return NextResponse.json({ courses: await getPublicSigaaCourses() });
    }
    const course = publicCourseIdSchema.safeParse(courseId),
      semester = semesterSchema.safeParse(params.get("semestre"));
    if (!course.success || !semester.success) {
      return NextResponse.json({ message: "Curso ou semestre inválido." }, { status: 400 });
    }
    return NextResponse.json(
      await getPublicSigaaOfferings(course.data, semester.data, params.get("atualizar") === "1")
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Não foi possível consultar a oferta do SIGAA. Tente novamente; você pode continuar com turmas já carregadas ou personalizadas.",
      },
      { status: 502 }
    );
  }
}
