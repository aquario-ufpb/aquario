import {
  calendarScheduleKey,
  roomCandidates,
  resolveRoomBinding,
  type CalendarRoomBinding,
  type RoomCandidate,
} from "../room-binding";
const room: RoomCandidate = {
  id: 100,
  codigo: "EDO1 / ALT1",
  turma: "07",
  horario: "35M23",
  room: { bloco: "CI", nome: "106" },
};
const binding: CalendarRoomBinding = {
  semester: "2026.2",
  sourceKey: "source",
  allocationId: 100,
  code: "EDO1",
  scheduleKey: calendarScheduleKey("35M23"),
  centerId: "CI",
  section: "07",
};
const resolve = (
  items = [room],
  selected = binding,
  code = "EDO1",
  schedule = "35M23",
  semester = "2026.2",
  center = "CI"
) => resolveRoomBinding(selected, code, schedule, semester, center, items);
it("matches normalized codes and equivalent timetable encoding but never partial schedules", () => {
  expect(roomCandidates(" edo1 ", "3M23 5M23", [room])).toEqual([room]);
  expect(roomCandidates("EDO", "35M23", [room])).toEqual([]);
  expect(roomCandidates("EDO1", "35M23 desconhecido", [room])).toEqual([]);
});
it("keeps ambiguous candidates for the user, without implicitly picking a section", () => {
  expect(roomCandidates("EDO1", "35M23", [room, { ...room, id: 101, turma: "01" }])).toHaveLength(
    2
  );
});
it("revalidates code, schedule, center and semester before using the chosen room", () => {
  expect(resolve()?.room.nome).toBe("106");
  expect(resolve([room], binding, "OTHER1")).toBeNull();
  expect(resolve([room], binding, "EDO1", "2T12")).toBeNull();
  expect(resolve([room], binding, "EDO1", "35M23", "2026.1")).toBeNull();
  expect(resolve([room], binding, "EDO1", "35M23", "2026.2", "OTHER")).toBeNull();
});
it("recovers changed allocation ids only when the confirmed section has one exact timetable candidate", () => {
  expect(resolve([{ ...room, id: 200 }])?.id).toBe(200);
  expect(
    resolve([
      { ...room, id: 200 },
      { ...room, id: 201 },
    ])
  ).toBeNull();
  expect(resolve([{ ...room, id: 200, turma: "01" }])).toBeNull();
});
