import { NextResponse } from "next/server";
import { offeringBatchSchema } from "@/lib/shared/planner/offering-search";
import { getOfferingBatch } from "@/lib/server/services/planner/offerings-batch";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 160000) {
      return NextResponse.json({ message: "Consulta muito grande." }, { status: 413 });
    }
    const parsed = offeringBatchSchema.safeParse(JSON.parse(body));
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Curso, semestre ou códigos inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json(await getOfferingBatch(parsed.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ampliar a busca de turmas." },
      { status: 502 }
    );
  }
}
