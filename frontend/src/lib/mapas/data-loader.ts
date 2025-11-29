/**
 * Data loader utilities for merging layout and room data
 */

import type { FloorLayout, RoomLayout, Room } from "../../../content/aquario-mapas/types";
import type { Floor } from "./types";

/**
 * Merges a FloorLayout with Room data to create a complete Floor
 * @param floorLayout - The floor layout with geometry data
 * @param rooms - Array of room metadata
 * @returns Complete Floor object with merged data
 */
export function loadFloorData(floorLayout: FloorLayout, rooms: Room[]): Floor {
  // Create a map of rooms by ID for quick lookup
  const roomsMap = new Map<string, Room>();
  rooms.forEach(room => {
    roomsMap.set(room.id, room);
  });

  // Merge layout rooms with room data
  const mergedRooms = floorLayout.rooms.map((roomLayout: RoomLayout) => {
    const roomData = roomsMap.get(roomLayout.id);

    if (!roomData) {
      console.warn(
        `Warning: No room data found for room ID "${roomLayout.id}" in floor "${floorLayout.id}". Using layout data only.`
      );
      // Return a minimal room object if data is missing
      return {
        id: roomLayout.id,
        location: roomLayout.id,
        type: "other" as const,
        shapes: roomLayout.shapes,
      };
    }

    // Merge layout shapes with room data
    return {
      ...roomData,
      shapes: roomLayout.shapes,
    };
  });

  return {
    id: floorLayout.id,
    name: floorLayout.name,
    level: floorLayout.level,
    blueprint: floorLayout.blueprint,
    rooms: mergedRooms,
  };
}

/**
 * Validates that all rooms in layout have corresponding room data
 * @param floorLayout - The floor layout
 * @param rooms - Array of room metadata
 * @returns Array of missing room IDs
 */
export function validateFloorData(floorLayout: FloorLayout, rooms: Room[]): string[] {
  const roomIds = new Set(rooms.map(r => r.id));
  const missingIds: string[] = [];

  floorLayout.rooms.forEach(roomLayout => {
    if (!roomIds.has(roomLayout.id)) {
      missingIds.push(roomLayout.id);
    }
  });

  return missingIds;
}
