import {
  matchesVersionedSigaaCourseAlias,
  resolveVersionedSigaaCourse,
  SIGAA_COURSE_ALIASES_VERSION,
} from "../course-aliases";

describe("versioned SIGAA course aliases", () => {
  it("publishes an explicit version for review and rollback", () => {
    expect(SIGAA_COURSE_ALIASES_VERSION).toBe("ufpb-2026-09-02");
  });

  it.each([
    ["Ciência da Computação", " CIÊNCIA   DA COMPUTAÇÃO "],
    ["Ciência da Computação", "Ciencia da Computacao"],
    ["Ciência da Computação", "Ciência da Computação (Bacharelado)"],
    ["Ciência da Computação", "Ciência da Computação - Graduação"],
    ["Ciência da Computação", "COMPUTACAO - GRADUACAO"],
    ["Ciência da Computação", "CIÊNCIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa"],
    ["Engenharia da Computação", "Engenharia de Computação"],
    ["Engenharia da Computação", "Engenharia da Computação - Graduação"],
    ["Engenharia da Computação", "Engenharia de Computação - Graduação"],
    ["Engenharia da Computação", "ENGENHARIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa"],
    ["Ciência de Dados e Inteligência Artificial", "Ciência de Dados e IA"],
    [
      "Ciência de Dados e Inteligência Artificial",
      "CIÊNCIA DE DADOS E INTELIGÊNCIA ARTIFICIAL (BACHARELADO)/CI - João Pessoa",
    ],
    ["Engenharia de Robôs", "Engenharia de Robos"],
    ["Engenharia de Robôs", "Engenharia de Robôs - Graduação"],
    ["Engenharia de Robôs", "ENGENHARIA DE ROBÔS (BACHARELADO)/CI - João Pessoa"],
  ])("accepts the approved profile and SIGAA pair %s / %s", (profile, sigaa) => {
    expect(matchesVersionedSigaaCourseAlias(profile, sigaa)).toBe(true);
  });

  it.each([
    ["Ciência da Computação", "Sistemas de Informação"],
    ["Outro", "Ciência da Computação"],
    ["Curso Experimental", "Curso Experimental"],
    ["Curso Experimental", "Curso Experimental Noturno"],
    // Other campuses / modalities must stay fail-closed.
    ["Ciência da Computação", "CIÊNCIA DA COMPUTAÇÃO (BACHARELADO)/CT - Campina Grande"],
    ["Ciência da Computação", "CIÊNCIA DA COMPUTAÇÃO (LICENCIATURA)/CCAE - Rio Tinto"],
    ["Ciência da Computação", "COMPUTAÇÃO (LICENCIATURA)/CI - João Pessoa - EAD"],
    ["Engenharia de Robôs", "ENGENHARIA DE ENERGIAS RENOVÁVEIS (BACHARELADO)/CEAR - João Pessoa"],
  ])("fails closed for an unknown or divergent pair %s / %s", (profile, sigaa) => {
    expect(matchesVersionedSigaaCourseAlias(profile, sigaa)).toBe(false);
  });

  it.each([null, "", "Curso Experimental"])("blocks an unresolved source %p", source => {
    expect(resolveVersionedSigaaCourse(source, [])).toEqual({
      kind: "blocked",
      reason: source ? "source_unrecognized" : "source_missing",
    });
  });

  it("resolves a common engineering label to one canonical catalog course", () => {
    expect(
      resolveVersionedSigaaCourse("Engenharia de Computação - Graduação", [
        {
          id: "course-1",
          name: "Engenharia da Computação",
          centerId: "center-1",
          centerName: "Centro de Informática",
          centerAcronym: "CI",
        },
      ])
    ).toMatchObject({
      kind: "resolved",
      canonicalName: "Engenharia da Computação",
      target: { id: "course-1" },
    });
  });

  it("resolves the SIGAA portal label for Ciência da Computação at CI", () => {
    expect(
      resolveVersionedSigaaCourse("CIÊNCIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa", [
        {
          id: "course-cc",
          name: "Ciência da Computação",
          centerId: "center-1",
          centerName: "Centro de Informática",
          centerAcronym: "CI",
        },
      ])
    ).toMatchObject({
      kind: "resolved",
      canonicalName: "Ciência da Computação",
      target: { id: "course-cc" },
    });
  });
});
