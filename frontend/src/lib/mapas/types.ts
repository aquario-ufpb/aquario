/**
 * Data structure for the Maps feature
 *
 * This file re-exports types from aquario-mapas and defines
 * the merged Room type that includes both layout (shapes) and room data.
 */

// Re-export base types from aquario-mapas
export type {
  EntidadeSlug,
  RoomPosition,
  RoomSize,
  RoomShape,
  Blueprint,
} from "../../../content/aquario-mapas/types";

// Re-export room type interfaces
export type {
  BaseRoom,
  Classroom,
  LabClass,
  LabResearch,
  ProfessorOffice,
  InstitutionalOffice,
  Bathroom,
  Corridor,
  Stairs,
  Library,
  SharedSpace,
  OtherRoom,
  Professor,
  ProfessorSlug,
} from "../../../content/aquario-mapas/types";

// Re-export layout types
export type { RoomLayout, FloorLayout, BuildingLayout } from "../../../content/aquario-mapas/types";

// Import base Room union type
import type {
  Room as BaseRoomUnion,
  Blueprint as BlueprintType,
  RoomShape,
} from "../../../content/aquario-mapas/types";

/**
 * Merged Room type - includes both room data and layout shapes
 * This is the type used throughout the application after merging layout and room data
 */
export type Room = BaseRoomUnion & {
  /** Shapes that make up this room (from layout) */
  shapes: RoomShape[];
};

export type Floor = {
  /** Unique floor identifier */
  id: string;
  /** Floor name (e.g., "Ground Floor", "1st Floor") */
  name: string;
  /** Floor level (0 = ground, 1 = first floor, -1 = basement, etc.) */
  level: number;
  /** Blueprint dimensions and settings */
  blueprint: BlueprintType;
  /** Rooms on this floor */
  rooms: Room[];
};

export type Building = {
  /** Unique building identifier */
  id: string;
  /** Building name */
  name: string;
  /** Building code or abbreviation */
  code?: string;
  /** Floors in this building */
  floors: Floor[];
};

export type MapsData = Building[];
