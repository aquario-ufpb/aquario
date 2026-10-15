jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
import { parsePublishedSaciAllocation } from "../saci";
const payload = {
  sigla: "CI",
  status: "published",
  description: "Alocação 2026.2",
  solution: {
    solution: [
      {
        bloco: "CI",
        nome: "106",
        classes: [{ id: 1, codigo: "EDO1", turma: "07", horario: "35M23" }],
      },
    ],
  },
};
it("reads published allocation and attaches room to each class", () => {
  expect(parsePublishedSaciAllocation(payload, "CI")).toMatchObject({
    semester: "2026.2",
    allocations: [{ id: 1, room: { bloco: "CI", nome: "106" } }],
  });
});
it("rejects unpublished solutions, wrong centers, unknown semesters and missing allocation structure", () => {
  expect(() => parsePublishedSaciAllocation({ ...payload, status: "draft" }, "CI")).toThrow();
  expect(() => parsePublishedSaciAllocation(payload, "OTHER")).toThrow();
  expect(() =>
    parsePublishedSaciAllocation({ ...payload, description: "A definir" }, "CI")
  ).toThrow();
  expect(() => parsePublishedSaciAllocation({ ...payload, solution: null }, "CI")).toThrow();
});
