/**
 * Data structure for the Maps feature
 *
 * This structure is designed to be:
 * - Extensible: Easy to add new properties to rooms, floors, or buildings
 * - Scalable: Can handle multiple buildings with many floors and rooms
 * - Precise: Rooms have exact position and size for accurate blueprint rendering
 */

/**
 * Entidade slug - references an entidade from aquario-entidades
 * This allows linking labs to their corresponding entidade pages
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

export type RoomType =
  | "classroom"
  | "lab (aula)"
  | "library"
  | "lab (pesquisa)"
  | "faculty-office"
  | "professor-office"
  | "office" // Legacy type, use faculty-office or professor-office instead
  | "bathroom"
  | "corridor"
  | "stairs"
  | "shared-space"
  | "other";

// Base metadata that all rooms share
type BaseRoomMetadata = {
  /** Room number or identifier */
  number?: string;
  /** Additional description */
  description?: string;
};

// Specific metadata types for different room types
export type ClassroomMetadata = BaseRoomMetadata & {
  type: "classroom";
  /** Room capacity */
  capacity?: number;
};

export type LabAulaMetadata = BaseRoomMetadata & {
  type: "lab (aula)";
  /** Room capacity */
  capacity?: number;
};

export type LabPesquisaMetadata = BaseRoomMetadata & {
  type: "lab (pesquisa)";
  /** Room capacity */
  capacity?: number;
  /** List of research labs in this room - references entidade slugs from aquario-entidades */
  labs?: EntidadeSlug[];
};

export type FacultyOfficeMetadata = BaseRoomMetadata & {
  type: "faculty-office";
};

export type ProfessorOfficeMetadata = BaseRoomMetadata & {
  type: "professor-office";
  /** List of professors/teachers assigned to this room */
  professors?: string[];
};

// Other room types (bathroom, corridor, etc.) use the base metadata
export type OtherRoomMetadata = BaseRoomMetadata & {
  type: "library" | "bathroom" | "corridor" | "stairs" | "shared-space" | "other" | "office";
  /** Room capacity (if applicable) */
  capacity?: number;
};

// Union of all metadata types
export type RoomMetadata =
  | ClassroomMetadata
  | LabAulaMetadata
  | LabPesquisaMetadata
  | FacultyOfficeMetadata
  | ProfessorOfficeMetadata
  | OtherRoomMetadata;

export type RoomShape = {
  /** Position of this shape segment */
  position: RoomPosition;
  /** Size of this shape segment */
  size: RoomSize;
};

export type Room = {
  /** Unique room identifier */
  id: string;
  /** Room name */
  name: string;
  /** Room title (optional) */
  title?: string;
  /** Shapes that make up this room (for L-shaped or complex rooms, use multiple shapes) */
  shapes: RoomShape[];
  /** Optional metadata for future extensibility */
  metadata?: RoomMetadata;
};

export type Blueprint = {
  /** Blueprint width in pixels */
  width: number;
  /** Blueprint height in pixels */
  height: number;
  /** Optional background image URL */
  backgroundImage?: string;
};

export type Floor = {
  /** Unique floor identifier */
  id: string;
  /** Floor name (e.g., "Ground Floor", "1st Floor") */
  name: string;
  /** Floor level (0 = ground, 1 = first floor, -1 = basement, etc.) */
  level: number;
  /** Blueprint dimensions and settings */
  blueprint: Blueprint;
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
