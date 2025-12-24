"use client";

import posthog from "posthog-js";
import { PostHogEvent } from "./posthog-events";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
const isDev = process.env.NODE_ENV === "development";

/**
 * Strongly-typed PostHog event tracking
 *
 * This function provides compile-time type safety for all PostHog events.
 * Event names and their required properties are defined in posthog-events.ts,
 * ensuring consistency across the entire codebase.
 *
 * @example
 * ```typescript
 * trackEvent('github_button_clicked')
 * ```
 */
export function trackEvent<T extends PostHogEvent["name"]>(
  name: T,
  properties?: Omit<Extract<PostHogEvent, { name: T }>, "name">
): void {
  if (!POSTHOG_KEY) {
    return;
  }

  if (isDev) {
    console.log("[PostHog] Track Event", name, properties);
  }
  posthog.capture(name, properties || {});
}

/**
 * Identify a user in PostHog
 * Call this when a user logs in or when you have their user data
 *
 * @param userId - Unique identifier for the user (e.g., user ID from database)
 * @param properties - Optional user properties (email, name, role, etc.)
 *
 * @example
 * ```typescript
 * identify('user-123', {
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   role: 'ADMIN'
 * })
 * ```
 */
export function identify(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    [key: string]: unknown;
  }
): void {
  if (!POSTHOG_KEY) {
    return;
  }

  if (isDev) {
    console.log("[PostHog] Identify", userId, properties);
  }

  posthog.identify(userId, properties);
}

/**
 * Reset PostHog (useful for logout)
 * This clears the identified user and resets the session
 */
export const reset = () => {
  if (!POSTHOG_KEY) {
    return;
  }
  posthog.reset();
};
