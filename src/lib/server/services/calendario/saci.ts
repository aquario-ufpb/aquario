import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { RoomCandidate } from "@/lib/shared/calendario/room-binding";
const origin = "https://sa.ci.ufpb.br";
const allocationSchema = z.object({
  sigla: z.string(),
  status: z.literal("published"),
  description: z.string(),
  solution: z.object({
    solution: z
      .array(
        z.object({
          bloco: z.string(),
          nome: z.string(),
          classes: z
            .array(
              z.object({
                id: z.number().int().positive(),
                codigo: z.string(),
                turma: z.string(),
                horario: z.string(),
              })
            )
            .max(4096),
        })
      )
      .max(512),
  }),
});
export function parsePublishedSaciAllocation(value: unknown, centerId: string) {
  const parsed = allocationSchema.parse(value);
  const semester = parsed.description.match(/\b(20\d{2}\.[1-4])\b/)?.[1];
  if (parsed.sigla.trim().toUpperCase() !== centerId || !semester) {
    throw new Error("SACI_ALLOCATION_MISMATCH");
  }
  const allocations: RoomCandidate[] = parsed.solution.solution.flatMap(room =>
    room.classes.map(item => ({ ...item, room: { bloco: room.bloco, nome: room.nome } }))
  );
  return { semester, allocations };
}
export const getPublishedSaciAllocation = unstable_cache(
  async (centerId: string) => {
    if (!/^[A-Z0-9_-]{1,20}$/.test(centerId)) {
      throw new Error("SACI_CENTER_INVALID");
    }
    const response = await fetch(`${origin}/api/paas/center?id=${encodeURIComponent(centerId)}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok || new URL(response.url || origin).origin !== origin) {
      throw new Error("SACI_UNAVAILABLE");
    }
    if (Number(response.headers.get("content-length")) > 5000000) {
      throw new Error("SACI_TOO_LARGE");
    }
    const text = await response.text();
    if (text.length > 5000000) {
      throw new Error("SACI_TOO_LARGE");
    }
    return parsePublishedSaciAllocation(JSON.parse(text), centerId);
  },
  ["calendar-saci-rooms-v1"],
  { revalidate: 300 }
);
