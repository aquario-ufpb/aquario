import { expect, test, type Locator, type Page } from "@playwright/test";
import { dismissSigaaPrompt } from "./session";

// Ciência da Computação (seeded from content/aquario-curriculos), period 1-2:
//   Cálculo Vetorial (1103118) and Cálculo I (1103177) have no prerequisite,
//   Álgebra Linear (1103179) requires 1103118,
//   Cálculo II (1103178) requires both 1103118 and 1103177.
const VETORIAL = "1103118";
const CALCULO_I = "1103177";
const CALCULO_II = "1103178";
const ALGEBRA_LINEAR = "1103179";

const group = (page: Page, title: RegExp) => page.getByRole("region", { name: title });
/** A discipline's own label ("· 1103178"), not a code cited inside another item's requirement. */
const label = (scope: Locator | Page, code: string) =>
  scope.getByText(`· ${code}`, { exact: true });
const empty = (page: Page) => page.getByRole("heading", { name: "Liberadas depois (0)" });

async function select(page: Page, query: string, nameLike: RegExp) {
  await page.getByLabel("Buscar cadeira para pagar agora").fill(query);
  await page.getByRole("button", { name: nameLike }).first().click();
}

test.beforeEach(async ({ page }) => {
  await dismissSigaaPrompt(page);
  await page.goto("/planejador");
  await expect(group(page, /^Disponíveis agora/)).toBeVisible({ timeout: 60_000 });
});

test("classifies the curriculum before anything is selected", async ({ page }) => {
  const available = group(page, /^Disponíveis agora/);
  await expect(label(available, CALCULO_I)).toBeVisible();
  await expect(label(available, VETORIAL)).toBeVisible();
  const blocked = group(page, /^Bloqueadas/);
  await expect(label(blocked, CALCULO_II)).toBeVisible();
  await expect(label(blocked, ALGEBRA_LINEAR)).toBeVisible();
  await expect(label(available, CALCULO_II)).toHaveCount(0);
  await expect(empty(page)).toBeVisible();
});

test("selecting a discipline unlocks its dependents for next term and shows what it delays", async ({
  page,
}) => {
  await select(page, VETORIAL, /^Adicionar .*VETORIAL/i);

  // Álgebra Linear only needs Cálculo Vetorial, so it opens next term.
  await expect(label(group(page, /^Liberadas depois/), ALGEBRA_LINEAR)).toBeVisible();
  await expect(label(group(page, /^Bloqueadas/), ALGEBRA_LINEAR)).toHaveCount(0);
  // Cálculo II also needs Cálculo I, which is available but not selected: paying it now would
  // free Cálculo II, so not paying it delays Cálculo II. Check the item of Cálculo I itself.
  const delayed = group(page, /^Atrasadas por não pagar agora/);
  // `has` is matched inside each item, so it must not carry the group's scope.
  const cause = delayed.getByRole("listitem").filter({ has: label(page, CALCULO_I) });
  await expect(cause).toHaveCount(1);
  await expect(cause).toContainText(`atrasa`);
  await expect(cause).toContainText(`(${CALCULO_II})`);
  // The selection itself no longer counts as available.
  await expect(label(group(page, /^Disponíveis agora/), VETORIAL)).toHaveCount(0);
});

test("removing the selection restores the initial classification", async ({ page }) => {
  await select(page, VETORIAL, /^Adicionar .*VETORIAL/i);
  await expect(label(group(page, /^Liberadas depois/), ALGEBRA_LINEAR)).toBeVisible();

  await page.getByRole("button", { name: /^Remover .*VETORIAL/i }).click();

  await expect(empty(page)).toBeVisible();
  await expect(label(group(page, /^Disponíveis agora/), VETORIAL)).toBeVisible();
  await expect(label(group(page, /^Bloqueadas/), ALGEBRA_LINEAR)).toBeVisible();
});

test("warns when the chosen discipline cannot be taken yet and does not count it as passed", async ({
  page,
}) => {
  await select(page, CALCULO_II, /^Adicionar .*INTEGRAL II/i);

  await expect(page.getByText(/não pode ser cursada agora/)).toBeVisible();
  await expect(empty(page)).toBeVisible();
  await expect(label(group(page, /^Bloqueadas/), CALCULO_II)).toBeVisible();
});
