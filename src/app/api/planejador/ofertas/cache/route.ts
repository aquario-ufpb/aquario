import { NextResponse } from "next/server";
import { offeringSnapshotSchema } from "@/lib/shared/planner/offering-search";
import { getCachedPublicSigaaOfferings } from "@/lib/server/services/planner/sigaa-offerings";

/** One database lookup replaces a serial replay of all cached course portals. No upstream calls. */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 160000) {
      return NextResponse.json({ message: "Consulta muito grande." }, { status: 413 });
    }
    const parsed = offeringSnapshotSchema.safeParse(JSON.parse(body));
    if (!parsed.success) {
      return NextResponse.json({ message: "Consulta de cache inválida." }, { status: 400 });
    }
    const { semester, courseIds, codes } = parsed.data;
    const rows = await getCachedPublicSigaaOfferings(semester, courseIds);
    const wanted = new Set(codes),
      found = new Set(rows.map(row => row.course.id));
    return NextResponse.json(
      {
        results: rows.map(row => ({
          ...row,
          offers: row.offers.filter(offer => wanted.has(offer.code)),
        })),
        missingCourseIds: [...new Set(courseIds)].filter(id => !found.has(id)),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler a oferta em cache." },
      { status: 502 }
    );
  }
}
