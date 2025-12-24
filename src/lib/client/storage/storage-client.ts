/**
 * Strongly-typed localStorage client
 *
 * This utility provides compile-time type safety for all localStorage operations.
 * Storage keys and their value types are defined in storage-types.ts,
 * ensuring consistency across the entire codebase.
 *
 * @example
 * ```typescript
 * // Set value
 * setStorage('calendario_selected_classes', [1, 2, 3]);
 *
 * // Get value
 * const classes = getStorage('calendario_selected_classes'); // number[] | null
 *
 * // Remove value
 * removeStorage('calendario_selected_classes');
 * ```
 */

import type { StorageKey, StorageValue } from "./storage-types";

const STORAGE_PREFIX = "aquario_";

/**
 * Get the full storage key with prefix
 */
function getStorageKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Get a value from localStorage
 *
 * @param key - The storage key
 * @returns The stored value, or null if not found or invalid
 */
export function getStorage<T extends StorageKey>(key: T): StorageValue<T> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const item = window.localStorage.getItem(getStorageKey(key));
    if (item === null) {
      return null;
    }

    const parsed = JSON.parse(item);
    return parsed as StorageValue<T>;
  } catch (error) {
    console.error(`[Storage] Error reading key "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in localStorage
 *
 * @param key - The storage key
 * @param value - The value to store
 */
export function setStorage<T extends StorageKey>(key: T, value: StorageValue<T>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(getStorageKey(key), serialized);
  } catch (error) {
    console.error(`[Storage] Error writing key "${key}":`, error);
  }
}

/**
 * Remove a value from localStorage
 *
 * @param key - The storage key
 */
export function removeStorage(key: StorageKey): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error(`[Storage] Error removing key "${key}":`, error);
  }
}

/**
 * Clear all storage keys with our prefix
 */
export function clearAllStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const keys = Object.keys(window.localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("[Storage] Error clearing storage:", error);
  }
}
