import { mapVagaToJson } from "../vaga-mapper";
import type { VagaWithRelations } from "@/lib/server/db/interfaces/vagas-repository.interface";

const vaga = (criadoPor: VagaWithRelations["criadoPor"]) =>
  ({
    id: "v1",
    titulo: "Estágio",
    descricao: "d",
    tipoVaga: "ESTAGIO",
    areas: [],
    criadoEm: new Date("2026-11-01T00:00:00Z"),
    dataFinalizacao: new Date("2026-12-01T00:00:00Z"),
    linkInscricao: "https://x.test",
    salario: null,
    sobreEmpresa: null,
    responsabilidades: [],
    requisitos: [],
    informacoesAdicionais: null,
    etapasProcesso: [],
    entidade: { id: "e1", nome: "ARIA", slug: "aria", tipo: "LABORATORIO", urlFoto: "/aria.png" },
    criadoPor,
  }) as unknown as VagaWithRelations;

describe("mapVagaToJson", () => {
  it("mostra quem publicou", () => {
    expect(mapVagaToJson(vaga({ id: "u1", nome: "Ana", urlFotoPerfil: null })).publicador).toEqual({
      nome: "Ana",
      urlFotoPerfil: undefined,
    });
  });

  it("vaga de quem excluiu a conta segue em nome da entidade", () => {
    expect(mapVagaToJson(vaga(null)).publicador).toEqual({
      nome: "ARIA",
      urlFotoPerfil: "/aria.png",
    });
  });
});
