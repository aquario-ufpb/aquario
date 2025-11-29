import {
  getBlueprintScale,
  getNonSharedSegments,
  getRoomCenter,
  getRoomColors,
  getTextDimensions,
  getSharedSegments,
  sharesEdge,
} from "../blueprint-utils";
import type { Floor, Room, RoomShape } from "@/lib/mapas/types";

const makeShape = (x: number, y: number, width: number, height: number): RoomShape => ({
  position: { x, y },
  size: { width, height },
});

const makeRoom = (overrides: Partial<Room> = {}): Room =>
  ({
    id: "room-1",
    location: "Room 1",
    type: "classroom",
    shapes: [makeShape(0, 0, 100, 50)],
    ...overrides,
  }) as Room;

describe("blueprint-utils", () => {
  describe("sharesEdge / getSharedSegments / getNonSharedSegments", () => {
    it("detects horizontal and vertical adjacency", () => {
      const a = makeShape(0, 0, 100, 50);
      const b = makeShape(100, 0, 100, 50); // touches a on the right
      const c = makeShape(0, 50, 100, 50); // touches a on the bottom
      const d = makeShape(200, 200, 50, 50); // separate

      expect(sharesEdge(a, b)).toBe(true);
      expect(sharesEdge(a, c)).toBe(true);
      expect(sharesEdge(a, d)).toBe(false);
    });

    it("computes shared and non-shared segments for an L-shaped configuration", () => {
      const large = makeShape(0, 0, 115, 115);
      const small = makeShape(0, 115, 55, 20);
      const all = [large, small];

      const bottomShared = getSharedSegments(large, "bottom", all);
      expect(bottomShared).toEqual([{ start: 0, end: 55 }]);

      const bottomGaps = getNonSharedSegments(0, 115, bottomShared);
      expect(bottomGaps).toEqual([{ start: 55, end: 115 }]);
    });

    it("handles partial edge sharing with two non-shared gaps", () => {
      const large = makeShape(0, 0, 100, 100);
      const small = makeShape(20, 100, 40, 20);
      const all = [large, small];

      const bottomShared = getSharedSegments(large, "bottom", all);
      expect(bottomShared).toEqual([{ start: 20, end: 60 }]);

      const bottomGaps = getNonSharedSegments(0, 100, bottomShared);
      expect(bottomGaps).toEqual([
        { start: 0, end: 20 },
        { start: 60, end: 100 },
      ]);
    });
  });

  describe("getRoomCenter", () => {
    it("computes the center of a single-shape room", () => {
      const room = makeRoom({
        shapes: [makeShape(10, 20, 100, 80)],
      });

      const { centerX, centerY } = getRoomCenter(room);
      expect(centerX).toBe(60);
      expect(centerY).toBe(60);
    });

    it("computes the average center across multiple shapes", () => {
      const room = makeRoom({
        shapes: [makeShape(0, 0, 100, 100), makeShape(100, 0, 100, 100)],
      });

      const { centerX, centerY } = getRoomCenter(room);
      expect(centerX).toBe(100);
      expect(centerY).toBe(50);
    });
  });

  describe("getRoomColors", () => {
    it("uses different colors for corridor vs non-corridor and hover states", () => {
      const corridor = getRoomColors(true, false, false);
      const hovered = getRoomColors(false, true, false);
      const normal = getRoomColors(false, false, false);

      expect(corridor.fillColor).not.toEqual(hovered.fillColor);
      expect(hovered.fillColor).not.toEqual(normal.fillColor);
    });
  });

  describe("getBlueprintScale", () => {
    const blueprint: Floor["blueprint"] = { width: 500, height: 400 };

    it("scales for desktop widths", () => {
      const { scaledWidth, scaledHeight } = getBlueprintScale(blueprint, 1400);
      expect(scaledWidth).toBeLessThanOrEqual(1400);
      expect(scaledHeight).toBeLessThanOrEqual(600);
    });

    it("scales for mobile widths", () => {
      const { scaledWidth, scaledHeight } = getBlueprintScale(blueprint, 375);
      expect(scaledWidth).toBeLessThanOrEqual(1000);
      expect(scaledHeight).toBeLessThanOrEqual(700);
    });
  });

  describe("getTextDimensions", () => {
    it("never returns a font size smaller than 8", () => {
      const veryNarrowRoom = makeRoom({
        location: "A very very very long room name that should shrink",
        shapes: [makeShape(0, 0, 20, 50)],
      });

      const { fontSize } = getTextDimensions(veryNarrowRoom);
      expect(fontSize).toBeGreaterThanOrEqual(8);
    });
  });
});
