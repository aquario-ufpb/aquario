import { expect, test, type Page } from "@playwright/test";
import { signInAsNewStudent } from "./session";

// Ciência da Computação (seeded from content/aquario-curriculos), period 1-2:
//   Cálculo Vetorial (1103118) and Cálculo I (1103177) have no prerequisite,
//   Álgebra Linear (1103179) requires 1103118,
//   Cálculo II (1103178) requires both 1103118 and 1103177.
const VETORIAL = "1103118";
const CALCULO_I = "1103177";
const CALCULO_II = "1103178";
const ALGEBRA_LINEAR = "1103179";

const group = (page: Page, title: RegExp) => page.getByRole("region", { name: title });

async function openPanel(page: Page) {
  await page.goto("/planejador");
  await expect(group(page, /^Disponíveis agora/)).toBeVisible({ timeout: 60_000 });
}

async function select(page: Page, query: string, nameLike: RegExp) {
  await page.getByLabel("Buscar cadeira para pagar agora").fill(query);
  await page.getByRole("button", { name: nameLike }).first().click();
}

test.beforeEach(async ({ page, request }) => {
  await signInAsNewStudent(page, request);
  await openPanel(page);
});

test("classifies the curriculum before anything is selected", async ({ page }) => {
  await expect(group(page, /^Disponíveis agora/).getByText(CALCULO_I)).toBeVisible();
  await expect(group(page, /^Disponíveis agora/).getByText(VETORIAL)).toBeVisible();
  await expect(
    group(page, /^Bloqueadas/)
      .getByText(CALCULO_II)
      .first()
  ).toBeVisible();
  await expect(
    group(page, /^Bloqueadas/)
      .getByText(ALGEBRA_LINEAR)
      .first()
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Liberadas depois (0)" })).toBeVisible();
});

test("selecting a discipline unlocks its dependents for next term and shows what it delays", async ({
  page,
}) => {
  await select(page, VETORIAL, /^Adicionar .*VETORIAL/i);

  // Álgebra Linear only needs Cálculo Vetorial, so it opens next term.
  await expect(
    group(page, /^Liberadas depois/)
      .getByText(ALGEBRA_LINEAR)
      .first()
  ).toBeVisible();
  // Cálculo II also needs Cálculo I, which is available but not selected: paying it now would
  // free Cálculo II, so not paying it delays Cálculo II.
  const delayed = group(page, /^Atrasadas por não pagar agora/);
  await expect(delayed.getByText(CALCULO_I).first()).toBeVisible();
  await expect(delayed.getByText(new RegExp(`atrasa .*${CALCULO_II}`)).first()).toBeVisible();
  // The selection itself no longer counts as available.
  await expect(group(page, /^Disponíveis agora/).getByText(VETORIAL)).toHaveCount(0);
});

test("removing the selection restores the initial classification", async ({ page }) => {
  await select(page, VETORIAL, /^Adicionar .*VETORIAL/i);
  await expect(
    group(page, /^Liberadas depois/)
      .getByText(ALGEBRA_LINEAR)
      .first()
  ).toBeVisible();

  await page.getByRole("button", { name: /^Remover .*VETORIAL/i }).click();

  await expect(page.getByRole("heading", { name: "Liberadas depois (0)" })).toBeVisible();
  await expect(group(page, /^Disponíveis agora/).getByText(VETORIAL)).toBeVisible();
});

test("warns when the chosen discipline cannot be taken yet and does not count it as passed", async ({
  page,
}) => {
  await select(page, CALCULO_II, /^Adicionar .*INTEGRAL II/i);

  await expect(page.getByText(/não pode ser cursada agora/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Liberadas depois (0)" })).toBeVisible();
});
