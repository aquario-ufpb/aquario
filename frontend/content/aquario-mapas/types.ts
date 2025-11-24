/**
 * Type definitions for the Maps feature
 *
 * This file defines hierarchical room types and layout structures.
 * Room types are specific interfaces that extend BaseRoom, providing
 * type safety and better developer experience.
 */

// ============================================
// Base Types
// ============================================

/**
 * Entidade slug - references an entidade from aquario-entidades
 * The slug matches the filename in content/aquario-entidades/centro-de-informatica/
 * (e.g., "lasid", "tril", "lmi")
 */
export type EntidadeSlug = string;

export type RoomPosition = {
  /** X coordinate in pixels (relative to blueprint) */
  x: number;
  /** Y coordinate in pixels (relative to blueprint) */
  y: number;
};

export type RoomSize = {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
};

export type RoomShape = {
  /** Position of this shape segment */
  position: RoomPosition;
  /** Size of this shape segment */
  size: RoomSize;
};

// ============================================
// Base Room Interface
// ============================================

export type BaseRoom = {
  /** Unique room identifier (e.g., "ci-312") */
  id: string;
  /** Display name/location (e.g., "CI 312") */
  location: string;
  /** Optional description */
  description?: string;
};

// ============================================
// Specific Room Types
// ============================================

export type Classroom = {
  type: "classroom";
  /** Room capacity */
  capacity?: number;
} & BaseRoom;

export type LabClass = {
  type: "lab-class";
  /** Room capacity */
  capacity?: number;
} & BaseRoom;

export type LabResearch = {
  type: "lab-research";
  /** Room capacity */
  capacity?: number;
  /** List of research labs - references entidade slugs from aquario-entidades */
  labs: EntidadeSlug[];
} & BaseRoom;

export type ProfessorOffice = {
  type: "professor-office";
  /** List of professors/teachers assigned to this room */
  professors: string[];
} & BaseRoom;

export type InstitutionalOffice = {
  type: "institutional-office";
  /** Department or institutional unit */
  department?: string;
} & BaseRoom;

export type Bathroom = {
  type: "bathroom";
  /** Gender designation: "male" | "female" | "unisex" */
  gender?: "male" | "female" | "unisex";
} & BaseRoom;

export type Corridor = {
  type: "corridor";
} & BaseRoom;

export type Stairs = {
  type: "stairs";
} & BaseRoom;

export type Library = {
  type: "library";
  /** Room capacity */
  capacity?: number;
} & BaseRoom;

export type SharedSpace = {
  type: "shared-space";
  /** Room capacity */
  capacity?: number;
} & BaseRoom;

export type OtherRoom = {
  type: "other";
  /** Room capacity */
  capacity?: number;
} & BaseRoom;

// ============================================
// Union Type
// ============================================

export type Room =
  | Classroom
  | LabClass
  | LabResearch
  | ProfessorOffice
  | InstitutionalOffice
  | Bathroom
  | Corridor
  | Stairs
  | Library
  | SharedSpace
  | OtherRoom;

// ============================================
// Layout Types (for /mapas)
// ============================================

export type RoomLayout = {
  /** Unique room identifier - matches Room.id */
  id: string;
  /** Shapes that make up this room */
  shapes: RoomShape[];
};

export type Blueprint = {
  /** Blueprint width in pixels */
  width: number;
  /** Blueprint height in pixels */
  height: number;
  /** Optional background image URL */
  backgroundImage?: string;
};

export type FloorLayout = {
  /** Unique floor identifier */
  id: string;
  /** Floor name (e.g., "Ground Floor", "1st Floor") */
  name: string;
  /** Floor level (0 = ground, 1 = first floor, -1 = basement, etc.) */
  level: number;
  /** Blueprint dimensions and settings */
  blueprint: Blueprint;
  /** Rooms on this floor (layout only - no metadata) */
  rooms: RoomLayout[];
};

export type BuildingLayout = {
  /** Unique building identifier */
  id: string;
  /** Building name */
  name: string;
  /** Building code or abbreviation */
  code?: string;
  /** Floors in this building */
  floors: FloorLayout[];
};
