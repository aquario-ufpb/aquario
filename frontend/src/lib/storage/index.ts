/**
 * Storage utilities - Strongly-typed localStorage client
 *
 * Provides type-safe access to localStorage with compile-time guarantees
 * for all storage keys and their value types.
 */

export { getStorage, setStorage, removeStorage, clearAllStorage } from "./storage-client";
export type { StorageKey, StorageValue, StorageData } from "./storage-types";
