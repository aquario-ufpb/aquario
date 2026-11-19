import { expect, test } from "@playwright/test";
import { dismissSigaaPrompt } from "./session";

test("publishes Markdown and restores its formatting in the project editor", async ({ page }) => {
  await dismissSigaaPrompt(page);
  await page.goto("/projetos/novo");
  await page.getByLabel("Título *", { exact: true }).fill("Projeto do editor");
  const editor = page.locator('[contenteditable="true"].tiptap');
  await editor.click();
  await page.getByRole("button", { name: "Negrito", exact: true }).click();
  await page.keyboard.type("Texto do projeto");
  await expect(editor.locator("strong")).toHaveText("Texto do projeto");

  const created = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === "/api/projetos" && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const project = await response.json();
  expect(project.textContent).toBe("**Texto do projeto**");
  await page.waitForURL("**/projetos");
  await page.goto(`/projetos/${project.slug}/editar`);
  await expect(editor.locator("strong")).toHaveText("Texto do projeto");
});
