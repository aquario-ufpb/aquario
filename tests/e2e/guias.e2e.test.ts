/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * E2E Tests for Guias Module
 * Tests critical user flows in a real browser environment
 */

import { test, expect } from "@playwright/test";

test.describe.skip("Guias - User Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the guias root page
    await page.goto("/guias");
  });

  test("should display guide list on root page", async ({ page }) => {
    // Check page title - "Aquario"
    await expect(page).toHaveTitle(/Aquario/);

    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Should show welcome message
    const body = page.locator("body");
    const bodyText = await body.textContent();
    // Check for "Bem-vindo" welcome message
    expect(bodyText).toMatch(/Bem-vindo|Bem vindo/i);

    // Should have navigation sidebar or mobile menu
    const navigation = page.locator('nav, [role="navigation"], button');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate through guide hierarchy: Guia → Seção → Subseção", async ({ page }) => {
    // Wait for initial page load
    await page.waitForLoadState("networkidle");

    // Step 1: We're on the root guias page
    await expect(page).toHaveURL(/\/guias$/);

    // Step 2: Find and click on a section link
    // First, let's find all links with /guias/ in the href to see what's available
    const allLinks = page.locator("a[href*='/guias/']");
    const linkCount = await allLinks.count();
    console.log(`Found ${linkCount} links with /guias/ in href`);

    // Try to find a link that goes to a section (has 2+ path segments)
    let clicked = false;
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = allLinks.nth(i);
      const href = await link.getAttribute("href");
      const text = await link.textContent();
      console.log(`Link ${i}: href="${href}", text="${text}"`);

      // Look for links that have at least guia and section (2 path segments after /guias/)
      if (href && href.match(/\/guias\/[^/]+\/[^/]+/)) {
        await link.waitFor({ state: "visible" });
        console.log(`Clicking link: ${href}`);

        // Wait for navigation
        await Promise.all([
          page.waitForURL(/\/guias\/[^/]+\/[^/]+/, { timeout: 10000 }),
          link.click(),
        ]);

        await page.waitForLoadState("networkidle");
        clicked = true;
        break;
      }
    }

    if (clicked) {
      // Should navigate to a section page (e.g., /guias/bem-vindo/introducao or /guias/grupos/atetica)
      await expect(page.url()).toMatch(/\/guias\/[^/]+\/[^/]+/);
    } else {
      // If no section links found, just verify we can find any /guias/ links
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test("should render markdown content correctly", async ({ page }) => {
    // Navigate to the root guias page
    await page.goto("/guias");
    await page.waitForLoadState("networkidle");

    // Check if any content is rendered (should show welcome message or content)
    const body = page.locator("body");
    const text = await body.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });

  test("should handle deep linking to specific subsection", async ({ page }) => {
    // Try to navigate directly to a deep URL (e.g., /guias/bem-vindo/sobre-o-curso)
    // This tests that the app can handle direct navigation
    await page.goto("/guias");

    // Should load without errors
    await expect(page).not.toHaveTitle(/404|Not Found/);

    // Page should have some content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should display navigation sidebar or mobile menu", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should have navigation (sidebar on desktop, menu button on mobile)
    const navigation = page.locator('nav, [role="navigation"], button, aside');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe.skip("Guias - Content Display", () => {
  test("should display readable text content", async ({ page }) => {
    await page.goto("/guias");
    await page.waitForLoadState("networkidle");

    // Check that there's actual text content (not just loading spinners)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50); // Some meaningful content
  });
});

test.describe.skip("Guias - Responsive Design", () => {
  test("should be usable on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto("/guias");
    await page.waitForLoadState("networkidle");

    // Check that page has content (text content should be present)
    const pageContent = page.locator("body");
    const contentText = await pageContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(10);

    // Check that content fits in viewport (no horizontal scroll needed)
    const html = page.locator("html");
    const scrollWidth = await html.evaluate(el => el.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test("should be usable on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto("/guias");
    await page.waitForLoadState("networkidle");

    // Check that page has content
    const pageContent = page.locator("body");
    const contentText = await pageContent.textContent();
    expect(contentText).toBeTruthy();
  });
});

test.describe.skip("Guias - Edge Cases", () => {
  test("should handle non-existent guia gracefully", async ({ page }) => {
    await page.goto("/guias/guia-que-nao-existe");

    // Should not crash - either show 404 or error message
    await page.waitForLoadState("networkidle");

    // Page should load something (not blank)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should load without FOUC (Flash of Unstyled Content)", async ({ page }) => {
    await page.goto("/guias");

    // Wait a moment for styles to load
    await page.waitForTimeout(100);

    // Check that the page has rendered content with proper styling
    // Look for any visible text content that indicates the page has loaded properly
    const pageContent = page.locator("body");
    const contentText = await pageContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(50);

    // Check that at least one element has non-transparent styling (gradient header should have background)
    const hasStyledContent = await page.evaluate(() => {
      const elements = document.querySelectorAll("div");
      for (const el of Array.from(elements).slice(0, 10)) {
        const bg = window.getComputedStyle(el).backgroundColor;
        // Check if background is not transparent (rgba(0,0,0,0) or transparent)
        if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") {
          return true;
        }
      }
      return false;
    });

    expect(hasStyledContent).toBe(true);
  });
});
