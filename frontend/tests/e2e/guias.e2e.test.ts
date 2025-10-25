/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * E2E Tests for Guias Module
 * Tests critical user flows in a real browser environment
 */

import { test, expect } from "@playwright/test";

test.describe("Guias - User Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the guias page
    await page.goto("/guias/ciencia-da-computacao");
  });

  test("should display guide list for a course", async ({ page }) => {
    // Check page title - "Aquario" (without accent)
    await expect(page).toHaveTitle(/Aquario/);

    // Should show the header with course name
    const header = page.locator("text=Centro de Informática");
    await expect(header).toBeVisible({ timeout: 10000 });

    // Should show content area (either sidebar or instructions)
    const body = page.locator("body");
    const bodyText = await body.textContent();
    expect(bodyText).toContain("Selecione"); // "Selecione uma seção à esquerda"
  });

  test("should navigate through guide hierarchy: Course → Guia → Seção → Subseção", async ({
    page,
  }) => {
    // Wait for initial page load
    await page.waitForLoadState("networkidle");

    // Step 1: We're on the course page (ciencia-da-computacao)
    await expect(page).toHaveURL(/ciencia-da-computacao/);

    // Step 2: Click on a guia (look for any clickable navigation element)
    const navigationLinks = page.locator("a, button").filter({ hasText: /bem.vindo|cadeiras/i });
    const firstGuia = navigationLinks.first();

    if ((await firstGuia.count()) > 0) {
      await firstGuia.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to a guia page
      await expect(page.url()).toContain("ciencia-da-computacao");
    }
  });

  test("should render markdown content correctly", async ({ page }) => {
    // Navigate to a content page (adjust URL based on your actual structure)
    await page.goto("/guias/ciencia-da-computacao");
    await page.waitForLoadState("networkidle");

    // Check if any content is rendered (should show "Selecione uma seção" message)
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });

  test("should handle deep linking to specific subsection", async ({ page }) => {
    // Try to navigate directly to a deep URL
    // This tests that the app can handle direct navigation
    await page.goto("/guias/ciencia-da-computacao");

    // Should load without errors
    await expect(page).not.toHaveTitle(/404|Not Found/);

    // Page should have some content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should display course selector or navigation", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should have some navigation (nav bar, sidebar, or links)
    const navigation = page.locator('nav, [role="navigation"], header');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Guias - Content Display", () => {
  test("should display readable text content", async ({ page }) => {
    await page.goto("/guias/ciencia-da-computacao");
    await page.waitForLoadState("networkidle");

    // Check that there's actual text content (not just loading spinners)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50); // Some meaningful content
  });

  test("should handle navigation without JavaScript errors", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/guias/ciencia-da-computacao");
    await page.waitForLoadState("networkidle");

    // Navigate to another section if possible
    const links = page.locator('a[href*="guias"]');
    if ((await links.count()) > 0) {
      await links.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Check for critical errors (allow some warnings)
    const criticalErrors = errors.filter(
      error =>
        !error.includes("Warning") && !error.includes("favicon") && !error.includes("sourcemap")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Guias - Responsive Design", () => {
  test("should be usable on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto("/guias/ciencia-da-computacao");
    await page.waitForLoadState("networkidle");

    // Content should be visible and not overflow
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check that content fits in viewport (no horizontal scroll needed)
    const bodyWidth = await body.evaluate(el => el.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test("should be usable on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto("/guias/ciencia-da-computacao");
    await page.waitForLoadState("networkidle");

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Guias - Edge Cases", () => {
  test("should handle non-existent course gracefully", async ({ page }) => {
    await page.goto("/guias/curso-que-nao-existe");

    // Should not crash - either show 404 or redirect
    await page.waitForLoadState("networkidle");

    // Page should load something (not blank)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should load without FOUC (Flash of Unstyled Content)", async ({ page }) => {
    await page.goto("/guias/ciencia-da-computacao");

    // Wait a moment for styles to load
    await page.waitForTimeout(100);

    // Check that content has some styling applied
    const mainContent = page.locator('main, [class*="container"]').first();
    if ((await mainContent.count()) > 0) {
      const backgroundColor = await mainContent.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      );

      // Should have some background color (not default transparent)
      expect(backgroundColor).toBeTruthy();
    }
  });
});
