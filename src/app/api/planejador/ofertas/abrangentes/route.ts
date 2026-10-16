import { NextResponse } from "next/server";
import { offeringBatchSchema } from "@/lib/shared/planner/offering-search";
import { getOfferingBatch } from "@/lib/server/services/planner/offerings-batch";
import { offeringRequestPolicy } from "@/lib/server/services/planner/offering-request-policy";

export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 160000) {
      return NextResponse.json({ message: "Consulta muito grande." }, { status: 413 });
    }
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
    }
    const parsed = offeringBatchSchema.safeParse(value);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Curso, semestre ou códigos inválidos." },
        { status: 400 }
      );
    }
    const policy = await offeringRequestPolicy(request, parsed.data.refresh);
    if (policy.response) {
      return policy.response;
    }
    return NextResponse.json(await getOfferingBatch({ ...parsed.data, refresh: policy.refresh }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ampliar a busca de turmas." },
      { status: 502 }
    );
  }
}
