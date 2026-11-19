import { createProjetoSchema, updateProjetoSchema } from "../projetos";

describe("project creation and partial updates", () => {
  it("applies draft status and empty tags only at creation", () => {
    const projeto = createProjetoSchema.parse({
      titulo: "Aquário",
      slug: "aquario",
      autores: [{ usuarioId: "550e8400-e29b-41d4-a716-446655440000", autorPrincipal: true }],
    });
    expect(projeto).toMatchObject({ status: "RASCUNHO", tags: [] });
    expect(updateProjetoSchema.parse({ titulo: "Novo título" })).toEqual({ titulo: "Novo título" });
  });

  it("accepts explicit status and normalizes tags in a partial update", () => {
    expect(updateProjetoSchema.parse({ status: "PUBLICADO", tags: [" CI ", "ci"] })).toEqual({
      status: "PUBLICADO",
      tags: ["ci"],
    });
  });
});
