import "@testing-library/jest-dom";
import { vi } from "vitest";

// Ensure global Map is available for jsdom (CI environment fix)
if (typeof global.Map === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Map = Map;
}

// Mock require.context for Webpack-specific features
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.require as any) = global.require || {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global.require as any).context = vi.fn((_directory, _useSubdirectories, _regExp) => {
  const keys = vi.fn(() => []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = vi.fn(_key => "");
  context.keys = keys;
  context.resolve = vi.fn(key => key);
  context.id = "mockContext";
  return context;
});

// Mock the LocalFileGuiasProvider to avoid require.context issues
vi.mock("@/lib/client/api/guias_providers/local-file-guias-provider", () => {
  return {
    LocalFileGuiasProvider: class MockLocalFileGuiasProvider {
      getByCurso() {
        return Promise.resolve([]);
      }
      getSecoes() {
        return Promise.resolve([]);
      }
      getSubSecoes() {
        return Promise.resolve([]);
      }
      getCentros() {
        return Promise.resolve([]);
      }
      getCursos() {
        return Promise.resolve([]);
      }
    },
  };
});

// Mock the LocalFilePaasProvider to avoid require.context issues
vi.mock("@/lib/client/api/paas_providers/local-file-paas-provider", () => {
  return {
    LocalFilePaasProvider: class MockLocalFilePaasProvider {
      getCenter() {
        return Promise.resolve({
          id: 0,
          centro: "Centro de Informática",
          date: "",
          description: "",
          hash: "",
          status: "",
          userId: null,
          sigla: "CI",
          paasPublicSolutions: [],
          solution: {
            id: 0,
            status: "Ready",
            error: "",
            paasPlanId: null,
            date: "",
            solution: [],
          },
        });
      }
    },
  };
});

// Mock the LocalFileVagasProvider to avoid require.context issues
vi.mock("@/lib/client/api/vagas_providers/local-file-vagas-provider", () => {
  return {
    LocalFileVagasProvider: class MockLocalFileVagasProvider {
      getAll() {
        return Promise.resolve([]);
      }
    },
  };
});

// Mock the LocalFileMapasProvider to avoid content submodule issues
vi.mock("@/lib/client/api/mapas_providers/local-file-mapas-provider", () => {
  return {
    LocalFileMapasProvider: class MockLocalFileMapasProvider {
      getBuildings() {
        return Promise.resolve([]);
      }
      getFloors() {
        return Promise.resolve([]);
      }
      getFloor() {
        return Promise.resolve(null);
      }
    },
  };
});
