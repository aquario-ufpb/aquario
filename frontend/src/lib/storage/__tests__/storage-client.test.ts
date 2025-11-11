/**
 * Unit tests for storage-client
 * Tests localStorage operations with type safety
 */

import { getStorage, setStorage, removeStorage, clearAllStorage } from "../storage-client";

// Mock localStorage
const createLocalStorageMock = () => {
  const store: Record<string, string> = {};

  // Create a Proxy to make Object.keys() work correctly
  const mock = new Proxy(store, {
    get(target, prop: string | symbol) {
      // Handle localStorage methods
      if (prop === "getItem") {
        return (key: string) => target[key] || null;
      }
      if (prop === "setItem") {
        return (key: string, value: string) => {
          target[key] = value.toString();
        };
      }
      if (prop === "removeItem") {
        return (key: string) => {
          delete target[key];
        };
      }
      if (prop === "clear") {
        return () => {
          Object.keys(target).forEach(key => delete target[key]);
        };
      }
      if (prop === "length") {
        return Object.keys(target).length;
      }
      if (prop === "key") {
        return (index: number) => {
          const keys = Object.keys(target);
          return keys[index] || null;
        };
      }
      // Return stored value for direct property access (only for string keys)
      if (typeof prop === "string") {
        return target[prop];
      }
      return undefined;
    },
    set(target, prop: string | symbol, value: string) {
      if (typeof prop === "string") {
        target[prop] = value;
      }
      return true;
    },
    deleteProperty(target, prop: string | symbol) {
      if (typeof prop === "string") {
        delete target[prop];
      }
      return true;
    },
    ownKeys(target) {
      return Object.keys(target);
    },
  }) as Storage;

  return { mock, store };
};

describe("storage-client", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>["mock"];
  let store: Record<string, string>;

  beforeEach(() => {
    // Create fresh mock before each test
    const mockData = createLocalStorageMock();
    localStorageMock = mockData.mock;
    store = mockData.store;

    // Reset localStorage mock before each test
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    localStorageMock.clear();
  });

  describe("setStorage", () => {
    it("should store a value with the correct key prefix", () => {
      setStorage("calendario_selected_classes", [1, 2, 3]);

      const stored = localStorageMock.getItem("aquario_calendario_selected_classes");
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toEqual([1, 2, 3]);
      }
    });

    it("should handle empty arrays", () => {
      setStorage("calendario_selected_classes", []);

      const stored = localStorageMock.getItem("aquario_calendario_selected_classes");
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toEqual([]);
      }
    });

    it("should handle large arrays", () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      setStorage("calendario_selected_classes", largeArray);

      const stored = localStorageMock.getItem("aquario_calendario_selected_classes");
      expect(stored).toBeTruthy();
      if (stored) {
        expect(JSON.parse(stored)).toHaveLength(100);
      }
    });
  });

  describe("getStorage", () => {
    it("should retrieve a stored value", () => {
      localStorageMock.setItem("aquario_calendario_selected_classes", JSON.stringify([1, 2, 3]));

      const value = getStorage("calendario_selected_classes");
      expect(value).toEqual([1, 2, 3]);
    });

    it("should return null for non-existent keys", () => {
      const value = getStorage("calendario_selected_classes");
      expect(value).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      localStorageMock.setItem("aquario_calendario_selected_classes", "invalid json{");

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const value = getStorage("calendario_selected_classes");
      expect(value).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle empty arrays", () => {
      localStorageMock.setItem("aquario_calendario_selected_classes", JSON.stringify([]));

      const value = getStorage("calendario_selected_classes");
      expect(value).toEqual([]);
    });
  });

  describe("removeStorage", () => {
    it("should remove a stored value", () => {
      localStorageMock.setItem("aquario_calendario_selected_classes", JSON.stringify([1, 2, 3]));

      removeStorage("calendario_selected_classes");

      const stored = localStorageMock.getItem("aquario_calendario_selected_classes");
      expect(stored).toBeNull();
    });

    it("should not throw when removing non-existent keys", () => {
      expect(() => {
        removeStorage("calendario_selected_classes");
      }).not.toThrow();
    });
  });

  describe("clearAllStorage", () => {
    it("should remove all keys with the prefix", () => {
      // Use setStorage to ensure keys are set with proper prefix
      setStorage("calendario_selected_classes", [1, 2, 3]);
      localStorageMock.setItem("aquario_other_key", JSON.stringify("value"));
      localStorageMock.setItem("other_prefix_key", JSON.stringify("should remain"));

      // Manually add keys to store object so Object.keys() can find them
      store["aquario_calendario_selected_classes"] = JSON.stringify([1, 2, 3]);
      store["aquario_other_key"] = JSON.stringify("value");
      store["other_prefix_key"] = JSON.stringify("should remain");

      // Verify keys exist before clearing
      expect(localStorageMock.getItem("aquario_calendario_selected_classes")).toBeTruthy();
      expect(localStorageMock.getItem("aquario_other_key")).toBeTruthy();
      expect(localStorageMock.getItem("other_prefix_key")).toBeTruthy();

      clearAllStorage();

      expect(localStorageMock.getItem("aquario_calendario_selected_classes")).toBeNull();
      expect(localStorageMock.getItem("aquario_other_key")).toBeNull();
      expect(localStorageMock.getItem("other_prefix_key")).toBeTruthy();
    });

    it("should handle empty storage", () => {
      expect(() => {
        clearAllStorage();
      }).not.toThrow();
    });
  });

  describe("SSR safety", () => {
    it("should handle window being undefined (SSR)", () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally removing window for SSR test
      delete global.window;

      expect(() => {
        setStorage("calendario_selected_classes", [1, 2, 3]);
        getStorage("calendario_selected_classes");
        removeStorage("calendario_selected_classes");
        clearAllStorage();
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe("Error handling", () => {
    it("should handle localStorage.setItem errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Create a new mock that throws on setItem
      const throwingMock = new Proxy(store, {
        get(_target, prop: string | symbol) {
          if (prop === "setItem") {
            return () => {
              throw new Error("QuotaExceededError");
            };
          }
          // Delegate other methods to the original mock
          return (localStorageMock as unknown as Record<string | symbol, unknown>)[prop];
        },
      }) as Storage;

      Object.defineProperty(window, "localStorage", {
        value: throwingMock,
        writable: true,
        configurable: true,
      });

      expect(() => {
        setStorage("calendario_selected_classes", [1, 2, 3]);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();

      // Restore original mock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });

      consoleSpy.mockRestore();
    });

    it("should handle localStorage.getItem errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Create a new mock that throws on getItem
      const throwingMock = new Proxy(store, {
        get(_target, prop: string | symbol) {
          if (prop === "getItem") {
            return () => {
              throw new Error("SecurityError");
            };
          }
          // Delegate other methods to the original mock
          return (localStorageMock as unknown as Record<string | symbol, unknown>)[prop];
        },
      }) as Storage;

      Object.defineProperty(window, "localStorage", {
        value: throwingMock,
        writable: true,
        configurable: true,
      });

      const value = getStorage("calendario_selected_classes");
      expect(value).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      // Restore original mock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });

      consoleSpy.mockRestore();
    });
  });
});
