import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SigaaClassDeadlines } from "../sigaa-class-deadlines";
import { downloadICSFile } from "@/lib/client/calendario/ics";
import { parseDeadlinePeriod } from "@/lib/client/calendario/sigaa-deadlines";

jest.mock("nanoid", () => ({ nanoid: () => "test-generated-id" }));
jest.mock("@/lib/client/calendario/ics", () => ({ downloadICSFile: jest.fn() }));

const observedAt = "2026-12-18T15:00:00Z";
const exam = { id: "11", title: "Prova 1", kind: "avaliacao", date: "04/01" };
const activity = { id: "12", title: "Lista 2", kind: "atividade", date: "27/12 à 02/01" };
const classItem = { sourceKey: "10", name: "Cálculo", deadlines: [exam, activity] };

test("mostra as datas da turma e exporta o mesmo intervalo nos dois calendários", async () => {
  render(<SigaaClassDeadlines classItem={classItem} observedAt={observedAt} />);
  const link = screen.getByRole("link", { name: /Adicionar Lista 2 ao Google Calendar/i });
  const params = new URL((link as HTMLAnchorElement).href).searchParams;
  expect(params.get("text")).toBe("Lista 2 · Cálculo");
  expect(params.get("dates")).toBe("20261227/20270103");
  fireEvent.click(screen.getByRole("button", { name: /Exportar calendário/i }));
  await waitFor(() => expect(downloadICSFile).toHaveBeenCalledTimes(1));
  const [blob] = jest.mocked(downloadICSFile).mock.calls[0];
  const text = await new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
  expect(text).toContain("DTSTART;VALUE=DATE:20261227");
  expect(text).toContain("DTEND;VALUE=DATE:20270103");
  expect(text).toContain("DTSTART;VALUE=DATE:20270104");
  expect(text).toContain("UID:sigaa.10:11@aquario");
});

test("mantém atividades sem data reconhecida visíveis e fora do calendário", () => {
  render(
    <SigaaClassDeadlines
      classItem={{ ...classItem, deadlines: [{ ...exam, date: "Em breve" }] }}
      observedAt={observedAt}
    />
  );
  expect(screen.getByText(/Em breve/)).toBeVisible();
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});

test("reconhece hora de João Pessoa e preserva um prazo sem duração", () => {
  expect(parseDeadlinePeriod("Ter, 16/06/2026 às 23:59", observedAt)).toEqual({
    start: [2026, 6, 17, 2, 59],
  });
  expect(parseDeadlinePeriod("16/06/2026 das 09:00 às 10:30", observedAt)).toEqual({
    start: [2026, 6, 16, 12, 0],
    end: [2026, 6, 16, 13, 30],
  });
  expect(parseDeadlinePeriod("16/06/2026 às 13:30 a 17/06/2026 às 15:15", observedAt)).toEqual({
    start: [2026, 6, 16, 16, 30],
    end: [2026, 6, 17, 18, 15],
  });
});

test.each([
  "Seg, 16/06/2026",
  "31/02/2026",
  "12/13",
  "",
  "20/11/2026 25:30",
  "29/11 a 27/11",
  "13/09/2026 à tarde",
])("rejeita data inválida ou ambígua %s", value => {
  expect(parseDeadlinePeriod(value, observedAt)).toBeNull();
});
