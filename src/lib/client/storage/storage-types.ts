/**
 * Strongly-typed localStorage definitions
 *
 * This file contains ALL localStorage keys we use, providing compile-time type safety
 * and a single source of truth for all stored data.
 *
 * To add a new storage key: just add it to the StorageData type below
 * and TypeScript will enforce the correct usage everywhere.
 */

// Calendar storage
export type CalendarioStorage = {
  key: "calendario_selected_classes";
  value: number[]; // Array of class IDs
};

// Union of all storage data types
export type StorageData = CalendarioStorage;

// Extract storage key type
export type StorageKey = StorageData["key"];

// Helper to get value type from key
export type StorageValue<T extends StorageKey> = Extract<StorageData, { key: T }>["value"];
