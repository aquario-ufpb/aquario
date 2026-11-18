import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Seeded Ciência da Computação course (see prisma/seed.ts); looked up by name, not by id. */
const COURSE_NAME = "Ciência da Computação";

/**
 * Registers a throwaway student through the real API and signs in by storing the JWT the way the
 * app does (`localStorage.token`). Without RESEND_API_KEY the account is auto-verified.
 */
export async function signInAsNewStudent(page: Page, request: APIRequestContext) {
  const options = await request.get("/api/cursos");
  expect(options.ok(), "GET /api/cursos (is the database seeded?)").toBeTruthy();
  const course = (await options.json()).find((item: { nome: string }) => item.nome === COURSE_NAME);
  expect(course, `seeded course "${COURSE_NAME}"`).toBeTruthy();

  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.ufpb.br`;
  const senha = "e2e-senha-forte-123";
  const register = await request.post("/api/auth/register", {
    data: { nome: "Estudante E2E", email, senha, centroId: course.centroId, cursoId: course.id },
  });
  expect(register.ok(), `register: ${await register.text()}`).toBeTruthy();

  const login = await request.post("/api/auth/login", { data: { email, senha } });
  expect(login.ok(), `login: ${await login.text()}`).toBeTruthy();
  const { token } = await login.json();
  await completeOnboarding(request, token);
  await page.addInitScript(value => window.localStorage.setItem("token", value), token);
  // The "Conecte com o SIGAA" prompt can appear at any moment after sign-in; dismiss it whenever it does.
  await page.addLocatorHandler(page.getByRole("dialog", { name: "Conecte com o SIGAA" }), dialog =>
    dialog.getByRole("button", { name: "Deixar pra depois" }).click()
  );
}

/** New accounts get a 7-step onboarding dialog that covers the page; mark every step as done. */
async function completeOnboarding(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const now = new Date().toISOString();
  const active = await request.get("/api/calendario-academico?ativo=true");
  const semester: { nome?: string } | null = active.ok() ? await active.json() : null;
  const step = { completedAt: now };
  const patch = await request.patch("/api/usuarios/me/onboarding", {
    headers,
    data: {
      flowVersion: 2,
      welcome: step,
      sigaa: step,
      periodo: step,
      concluidas: step,
      entidades: step,
      done: step,
      ...(semester?.nome && { semesters: { [semester.nome]: { cursando: step, turmas: step } } }),
    },
  });
  expect(patch.ok(), `onboarding: ${await patch.text()}`).toBeTruthy();
}
