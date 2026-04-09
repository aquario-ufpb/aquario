import { z } from "zod";

/**
 * Zod request schemas for the /api/usuarios/* endpoints.
 *
 * See src/lib/server/api-schemas/auth.ts for the rationale on why these
 * live outside of the route.ts files (Next.js 15 route export restrictions).
 */

/**
 * ISO date string validator used by the membership endpoints. Accepts any
 * string parseable by `new Date()`.
 */
const dateString = z.string().refine(v => !isNaN(Date.parse(v)), { message: "Data inválida" });

/**
 * Nested step-state shape used by the onboarding metadata schema. Every
 * onboarding step tracks either a `completedAt` or a `skippedAt` ISO
 * timestamp (or neither).
 */
const stepStateSchema = z
  .object({
    completedAt: z.string().optional(),
    skippedAt: z.string().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Admin endpoints on /api/usuarios/{id}/*
// ---------------------------------------------------------------------------

export const updateUserInfoSchema = z.object({
  centroId: z.string().optional(),
  cursoId: z.string().optional(),
});

export const updateRoleSchema = z.object({
  papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]),
});

export const updateSlugSchema = z.object({
  slug: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Facade user management (admin only)
// ---------------------------------------------------------------------------

export const createFacadeUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  centroId: z.string().uuid("Centro inválido"),
  cursoId: z.string().uuid("Curso inválido"),
});

export const mergeFacadeUserSchema = z.object({
  facadeUserId: z.string().uuid("ID de usuário facade inválido"),
  realUserId: z.string().uuid("ID de usuário real inválido"),
  deleteFacade: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Self-service endpoints on /api/usuarios/me/*
// ---------------------------------------------------------------------------

/**
 * Replaces the full set of completed disciplines for the current user.
 */
export const updateCompletedDisciplinasSchema = z.object({
  disciplinaIds: z.array(z.string().uuid()),
});

/**
 * Marks disciplines with a status (concluida, cursando, or none). Used by
 * the onboarding flow and the curriculum page.
 */
export const marcarDisciplinasSchema = z.object({
  disciplinaIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["concluida", "cursando", "none"]),
});

/**
 * Create a new membership for the current user in the given entity.
 */
export const createOwnMembershipSchema = z.object({
  entidadeId: z.string().uuid("ID de entidade inválido"),
  papel: z.enum(["ADMIN", "MEMBRO"]).optional().default("MEMBRO"),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: dateString.optional(),
  endedAt: dateString.nullable().optional(),
});

/**
 * Update fields on a membership owned by the current user.
 */
export const updateOwnMembershipSchema = z.object({
  papel: z.enum(["ADMIN", "MEMBRO"]).optional(),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: dateString.optional(),
  endedAt: dateString.nullable().optional(),
});

/**
 * Onboarding metadata patch. The API deep-merges the provided fields into
 * the stored metadata, so every field is optional.
 */
export const onboardingPatchSchema = z
  .object({
    welcome: z.object({ completedAt: z.string() }).strict().optional(),
    periodo: stepStateSchema.optional(),
    concluidas: stepStateSchema.optional(),
    entidades: stepStateSchema.optional(),
    done: z.object({ completedAt: z.string() }).strict().optional(),
    semesters: z
      .record(
        z.string(),
        z
          .object({
            cursando: stepStateSchema.optional(),
            turmas: stepStateSchema.optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

/**
 * Patch the current user's academic period (semester 1-12, "12+" or "graduado").
 * Pass `null` to clear the field.
 */
export const updatePeriodoSchema = z.object({
  periodoAtual: z.string().min(1).nullable(),
});

/**
 * Patch the current user's profile photo URL. Pass `null` to clear.
 */
export const updatePhotoSchema = z.object({
  urlFotoPerfil: z.string().url().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Semester-scoped enrolled disciplines (/usuarios/me/semestres/{id}/...)
// ---------------------------------------------------------------------------

/**
 * Replaces the full list of enrolled disciplines for a specific semester.
 * Disciplines are referenced by their PAAS `codigoDisciplina` and resolved
 * to internal IDs server-side.
 */
export const saveSemestreDisciplinasSchema = z.object({
  disciplinas: z.array(
    z.object({
      codigoDisciplina: z.string().min(1),
      turma: z.string().nullish(),
      docente: z.string().nullish(),
      horario: z.string().nullish(),
      codigoPaas: z.number().int().nullish(),
    })
  ),
});

/**
 * Patch the turma snapshot fields on a single DisciplinaSemestre record.
 */
export const updateDisciplinaSemestreSchema = z.object({
  turma: z.string().nullish(),
  docente: z.string().nullish(),
  horario: z.string().nullish(),
  codigoPaas: z.number().int().nullish(),
});
