/** @jest-environment node */
import {
  parseCourseOfferings,
  parsePublicCourses,
  parseSearchForm,
} from "../sigaa-offerings-parser";
const course = { id: "123", name: "Engenharia", campus: "João Pessoa", modality: "Presencial" };
const form = `<form id="form" action="/sigaa/public/curso/turmas.jsf"><input type="hidden" name="javax.faces.ViewState" value="anonymous-state"><input name="form:inputAno" value="2026"><input type="submit" name="form:dynamic" value="Buscar"></form>`;
const html = `${form}<div id="turmasAbertas"><table class="listagem"><thead><tr><td class="subListagem">1103180 - SÉRIES E EDO</td></tr><tr><th class="colVagas">Vgs Reservadas</th></tr></thead><tbody><tr><td>2026.2</td><td>07</td><td class="nome">Docente</td><td class="colVagas">12</td><td class="horario">35M23</td></tr><tr><td>2025.2</td><td>01</td><td class="nome">Docente</td><td class="colVagas">0</td><td class="horario">24M12</td></tr></tbody></table></div>`;
it("extracts reservations for the queried course, without inventing available seats", () => {
  const result = parseCourseOfferings(html, course, "2026.2", "2026-10-14T00:00:00Z");
  expect(result.offers).toHaveLength(1);
  expect(result.offers[0]).toMatchObject({
    code: "1103180",
    section: "07",
    schedule: "35M23",
    reservations: { "123": 12 },
    availableSeats: null,
    totalSeats: null,
  });
});
it("does not convert a missing reservation into zero", () => {
  expect(
    parseCourseOfferings(
      html.replace("12</td>", "--</td>"),
      course,
      "2026.2",
      "2026-10-14T00:00:00Z"
    ).offers[0].reservations["123"]
  ).toBeNull();
});
it("fails closed when the upstream form/layout changes", () => {
  expect(() =>
    parseCourseOfferings("<h1>Login</h1>", course, "2026.2", "2026-10-14T00:00:00Z")
  ).toThrow();
  expect(() => parsePublicCourses("<h1>Erro</h1>")).toThrow();
});
it("discovers dynamic JSF submit names without evaluating upstream JavaScript", () => {
  expect(parseSearchForm(form).fields.get("form:dynamic")).toBe("Buscar");
  expect(parseSearchForm(form).fields.get("javax.faces.ViewState")).toBe("anonymous-state");
});

it("ignores inline JSF scripts inside component headings", () => {
  const upstream = html.replace(
    'class="subListagem">',
    'class="subListagem"><script>function jsfcljs(){}</script>'
  );
  expect(
    parseCourseOfferings(upstream, course, "2026.2", "2026-10-14T00:00:00Z").offers[0].code
  ).toBe("1103180");
});
