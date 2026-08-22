import { matchesVersionedSigaaCourseAlias, SIGAA_COURSE_ALIASES_VERSION } from "../course-aliases";

describe("versioned SIGAA course aliases", () => {
  it("publishes an explicit version for review and rollback", () => {
    expect(SIGAA_COURSE_ALIASES_VERSION).toBe("ufpb-2026-08-01");
  });

  it.each([
    ["Ciência da Computação", " CIÊNCIA   DA COMPUTAÇÃO "],
    ["Ciência da Computação", "Ciencia da Computacao"],
    ["Ciência da Computação", "Ciência da Computação (Bacharelado)"],
    ["Ciência da Computação", "COMPUTACAO - GRADUACAO"],
    ["Engenharia da Computação", "Engenharia de Computação"],
    ["Ciência de Dados e Inteligência Artificial", "Ciência de Dados e IA"],
    ["Engenharia de Robôs", "Engenharia de Robos"],
  ])("accepts the approved profile and SIGAA pair %s / %s", (profile, sigaa) => {
    expect(matchesVersionedSigaaCourseAlias(profile, sigaa)).toBe(true);
  });

  it.each([
    ["Ciência da Computação", "Sistemas de Informação"],
    ["Outro", "Ciência da Computação"],
    ["Curso Experimental", "Curso Experimental"],
    ["Curso Experimental", "Curso Experimental Noturno"],
  ])("fails closed for an unknown or divergent pair %s / %s", (profile, sigaa) => {
    expect(matchesVersionedSigaaCourseAlias(profile, sigaa)).toBe(false);
  });
});
