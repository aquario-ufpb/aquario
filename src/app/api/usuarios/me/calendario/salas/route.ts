import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";
import { getPublishedSaciAllocation } from "@/lib/server/services/calendario/saci";
import {
  calendarScheduleKey,
  calendarSemesterSchema,
  roomBindingRequestSchema,
  roomBindingSchema,
  roomCandidates,
} from "@/lib/shared/calendario/room-binding";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status });
function privateRoute(
  handler: (request: Request, owner: UsuarioWithRelations) => Promise<Response>
) {
  return async (request: Request) => {
    let response: Response;
    try {
      response = await withAuth(request, handler);
    } catch {
      response = json(
        { message: "Não foi possível consultar ou salvar a sala. Tente novamente." },
        503
      );
    }
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Authorization");
    return response;
  };
}
async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > 8192) {
    throw new Error("BODY_SIZE");
  }
  const body = await request.text();
  if (Buffer.byteLength(body) > 8192) {
    throw new Error("BODY_SIZE");
  }
  return JSON.parse(body) as unknown;
}
export const GET = privateRoute(async (request, owner) => {
  const semester = calendarSemesterSchema.safeParse(
    new URL(request.url).searchParams.get("semestre")
  );
  if (!semester.success) {
    return json({ message: "Semestre inválido." }, 400);
  }
  const bindings = await getContainer().calendarRoomBindingRepository.list(
    owner.id,
    owner.cursoId,
    semester.data
  );
  return json({ bindings });
});
export const POST = privateRoute(async (request, owner) => {
  let parsed;
  try {
    parsed = roomBindingRequestSchema.safeParse(await readBody(request));
  } catch {
    return json({ message: "Escolha de sala inválida." }, 400);
  }
  if (!parsed.success) {
    return json({ message: "Escolha de sala inválida." }, 400);
  }
  const input = parsed.data;
  const container = getContainer();
  const state = await container.sigaaRepository.readImportedState(usuarioIdSchema.parse(owner.id));
  const snapshot = state.snapshot?.payload;
  const source = snapshot?.classes.find(
    item =>
      item.sourceKey === input.sourceKey &&
      (item.semester ?? snapshot.identity.sourceSemester) === input.semester
  );
  if (
    state.connection?.status !== "CONNECTED" ||
    !source?.code ||
    !calendarScheduleKey(source.scheduleRaw)
  ) {
    return json(
      {
        message:
          "Esta turma não corresponde à importação atual. Atualize os dados SIGAA antes de escolher a sala.",
      },
      409
    );
  }
  const centerId = owner.centro.sigla.trim().toUpperCase();
  const allocation = await getPublishedSaciAllocation(centerId);
  if (allocation.semester !== input.semester) {
    return json({ message: "A oferta SACI é de outro semestre. Nenhuma sala foi vinculada." }, 409);
  }
  const candidates = roomCandidates(source.code, source.scheduleRaw, allocation.allocations).filter(
    item => item.id === input.allocationId
  );
  if (candidates.length !== 1 || !candidates[0].room.nome.trim()) {
    return json(
      {
        message:
          "Esta opção não corresponde ao código e horário da turma na oferta atual. Atualize a lista do SACI.",
      },
      409
    );
  }
  const selected = candidates[0];
  const binding = roomBindingSchema.safeParse({
    ...input,
    code: source.code,
    scheduleKey: calendarScheduleKey(source.scheduleRaw),
    centerId,
    section: selected.turma,
  });
  if (!binding.success) {
    return json({ message: "Os dados da turma SACI são inválidos. Confirme a oferta atual." }, 409);
  }
  try {
    await container.calendarRoomBindingRepository.save(owner.id, owner.cursoId, binding.data);
  } catch (error) {
    if (error instanceof Error && /CALENDAR_(?:COURSE_CHANGED|BINDING_QUOTA)/.test(error.message)) {
      return json(
        { message: "O perfil mudou ou o limite de salas foi atingido. Atualize a página." },
        409
      );
    }
    throw error;
  }
  return json({ saved: true });
});
export const DELETE = privateRoute(async (request, owner) => {
  let parsed;
  try {
    parsed = roomBindingRequestSchema
      .omit({ allocationId: true })
      .safeParse(await readBody(request));
  } catch {
    return json({ message: "Escolha de sala inválida." }, 400);
  }
  if (!parsed.success) {
    return json({ message: "Escolha de sala inválida." }, 400);
  }
  await getContainer().calendarRoomBindingRepository.delete(
    owner.id,
    owner.cursoId,
    parsed.data.semester,
    parsed.data.sourceKey
  );
  return json({ deleted: true });
});
