/**
 * Data structure for the Maps feature
 *
 * This structure is designed to be:
 * - Extensible: Easy to add new properties to rooms, floors, or buildings
 * - Scalable: Can handle multiple buildings with many floors and rooms
 * - Precise: Rooms have exact position and size for accurate blueprint rendering
 */

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

export type RoomMetadata = {
  /** Room number or identifier */
  number?: string;
  /** Room capacity (if applicable) */
  capacity?: number;
  /** Room type (e.g., "classroom", "lab", "office", "bathroom") */
  type?: string;
  /** Additional description */
  description?: string;
};

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
  /** Address or location description */
  address?: string;
  /** Floors in this building */
  floors: Floor[];
};

export type MapsData = Building[];
