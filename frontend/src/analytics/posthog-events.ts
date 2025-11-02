/**
 * Strongly-typed PostHog event definitions
 *
 * This file contains ALL PostHog events we send, providing compile-time type safety
 * and a single source of truth for all analytics events.
 *
 * To add a new event: just add it to the PostHogEvent union type below
 * and TypeScript will enforce the correct usage everywhere.
 */

// UI Interaction events
export type UIInteractionEvent = {
  name: "github_button_clicked";
};

// Union of all PostHog events
export type PostHogEvent = UIInteractionEvent;
