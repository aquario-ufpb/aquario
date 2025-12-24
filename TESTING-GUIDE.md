# Testing Guide

## Test Types

| Type            | Framework  | What to Test              | Location                                  |
| --------------- | ---------- | ------------------------- | ----------------------------------------- |
| **Unit**        | Jest       | Pure functions, utilities | `src/**/__tests__/*.test.ts`              |
| **Integration** | Vitest     | React hooks, components   | `src/**/__tests__/*.integration.test.tsx` |
| **E2E**         | Playwright | User flows in browser     | `tests/e2e/*.e2e.test.ts`                 |

## Running Tests

```bash
# All tests
npm run test:all

# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# Integration tests
npm run test:integration
npm run test:integration:ui

# E2E tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

## Writing Tests

### Unit Tests (Jest)

For pure logic without React dependencies:

```typescript
// src/lib/shared/__tests__/my-utils.test.ts
describe("myFunction", () => {
  it("should return expected result", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("should handle edge cases", () => {
    expect(myFunction("")).toBe(null);
  });
});
```

### Integration Tests (Vitest)

For React hooks and components with state:

```typescript
// src/lib/client/hooks/__tests__/use-data.integration.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../../api/data-service");

describe("useData", () => {
  it("should fetch data successfully", async () => {
    mockService.getData.mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useData(), {
      wrapper: createTestQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
```

### E2E Tests (Playwright)

For full user journeys:

```typescript
// tests/e2e/feature.e2e.test.ts
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("should complete user flow", async ({ page }) => {
    await page.goto("/feature");
    await page.click('button:has-text("Submit")');
    await expect(page.locator(".success")).toBeVisible();
  });
});
```

## Test Utilities

Located in `src/__tests__/utils/`:

```typescript
// Create React Query wrapper for hooks
import { createTestQueryWrapper } from "@/__tests__/utils/test-providers";

// Mock data
import { mockGuias } from "@/__tests__/utils/guias-mock-data";
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive names**: `should return error when input is empty`
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies** (APIs, services)
5. **Keep tests independent** (no shared mutable state)

## CI/CD

Tests run automatically on every PR via GitHub Actions. All tests must pass before merging.
