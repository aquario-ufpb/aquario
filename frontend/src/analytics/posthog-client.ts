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
 * Reset PostHog (useful for logout)
 */
export const reset = () => {
  if (!POSTHOG_KEY) {
    return;
  }
  posthog.reset();
};
