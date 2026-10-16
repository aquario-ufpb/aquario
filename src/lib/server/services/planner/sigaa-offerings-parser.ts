import { load } from "cheerio";
import type { OfferingResponse, PlannerOffer, PublicCourse } from "@/lib/shared/planner/types";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
export function parsePublicCourses(html: string): PublicCourse[] {
  const $ = load(html);
  const courses = new Map<string, PublicCourse>();
  $("a[href*='portal.jsf?id=']").each((_i, element) => {
    const id = $(element)
      .attr("href")
      ?.match(/[?&]id=(\d+)/)?.[1];
    const cells = $(element).closest("tr").children("td");
    if (id && cells.length >= 3) {
      courses.set(id, {
        id,
        name: clean(cells.eq(0).text()),
        campus: clean(cells.eq(1).text()),
        modality: clean(cells.eq(2).text()),
      });
    }
  });
  if (!courses.size) {
    throw new Error("SIGAA_COURSES_LAYOUT_CHANGED");
  }
  return [...courses.values()];
}

export function parseCourseOfferings(
  html: string,
  course: PublicCourse,
  semester: string,
  observedAt: string
): OfferingResponse {
  const $ = load(html);
  $("script, style").remove();
  const offers: PlannerOffer[] = [];
  if (!$("#form").length || !$("input[name='form:inputAno']").length) {
    throw new Error("SIGAA_OFFERINGS_LAYOUT_CHANGED");
  }
  const sourceUrl = `https://sigaa.ufpb.br/sigaa/public/curso/turmas.jsf?id=${course.id}&lc=pt_BR`;
  $("#turmasAbertas table.listagem").each((_i, table) => {
    const heading = clean($(table).find(".subListagem").first().text());
    const match = heading.match(/^([A-Z\d]+)\s*-\s*(.+)$/i);
    if (!match) {
      throw new Error("SIGAA_COMPONENT_LAYOUT_CHANGED");
    }
    const reservedHeader = $(table).find("th.colVagas").text();
    const isReserved = /reservad/i.test(reservedHeader);
    $(table)
      .find("tbody tr")
      .each((_j, row) => {
        const cells = $(row).children("td");
        if (!cells.length) {
          return;
        }
        const period = clean(cells.eq(0).text());
        if (period !== semester) {
          return;
        }
        if (cells.length < 4 || !$(row).find(".horario").length) {
          throw new Error("SIGAA_CLASS_LAYOUT_CHANGED");
        }
        const section = clean(cells.eq(1).text());
        const schedule = clean($(row).find(".horario").text());
        const rawReservation = clean($(row).find(".colVagas").text());
        const reservation =
          isReserved && /^\d+$/.test(rawReservation) ? Number(rawReservation) : null;
        if (!section) {
          throw new Error("SIGAA_SECTION_MISSING");
        }
        const code = match[1].toUpperCase();
        offers.push({
          id: `sigaa:${semester}:${code}:${section}:${schedule}`,
          code,
          name: match[2],
          section,
          semester,
          schedule,
          teacher: clean($(row).find(".nome").text()),
          location: null,
          coordinates: null,
          source: "SIGAA",
          reservations: { [course.id]: reservation },
          totalSeats: null,
          availableSeats: null,
          demand: null,
          observedAt,
          sourceUrl,
        });
      });
  });
  return {
    course,
    offers,
    observedAt,
    warnings: [
      "A consulta pública informa reservas para o curso consultado, não saldo de vagas restantes nem posição na disputa.",
      "A localização não consta nesta consulta. Confira ou informe o local para avaliar deslocamento.",
      ...(offers.length
        ? []
        : [
            "Nenhuma turma retornada para este curso e semestre. A oferta pode ainda não estar publicada.",
          ]),
    ],
  };
}

export function parseSearchForm(html: string): { action: string; fields: URLSearchParams } {
  const $ = load(html);
  const form = $("form#form");
  const fields = new URLSearchParams();
  if (!form.length) {
    throw new Error("SIGAA_SEARCH_FORM_MISSING");
  }
  form.find("input[type='hidden']").each((_i, element) => {
    const name = $(element).attr("name");
    if (name) {
      fields.set(name, $(element).attr("value") ?? "");
    }
  });
  const button = form
    .find("input[type='submit']")
    .filter((_i, element) => $(element).attr("value") === "Buscar")
    .first();
  const buttonName = button.attr("name");
  if (!buttonName || !fields.has("javax.faces.ViewState")) {
    throw new Error("SIGAA_SEARCH_FORM_CHANGED");
  }
  fields.set(buttonName, "Buscar");
  return { action: form.attr("action") ?? "/sigaa/public/curso/turmas.jsf", fields };
}
