import type { CalendarRoomBinding } from "@/lib/shared/calendario/room-binding";
export type ICalendarRoomBindingRepository = {
  list(ownerId: string, courseId: string, semester: string): Promise<CalendarRoomBinding[]>;
  save(ownerId: string, courseId: string, binding: CalendarRoomBinding): Promise<void>;
  delete(ownerId: string, courseId: string, semester: string, sourceKey: string): Promise<void>;
};
