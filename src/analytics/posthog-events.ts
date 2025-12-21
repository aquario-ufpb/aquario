/**
 * Strongly-typed PostHog event definitions
 *
 * This file contains ALL PostHog events we send, providing compile-time type safety
 * and a single source of truth for all analytics events.
 *
 * To add a new event: just add it to the PostHogEvent union type below
 * and TypeScript will enforce the correct usage everywhere.
 */

import { TipoEntidade } from "@/lib/shared/types/entidade.types";

// UI Interaction events
export type UIInteractionEvent = {
  name: "github_button_clicked";
};

export type EntidadesEvent =
  | {
      name: "entidade_viewed";
      entidade_name: string;
      entidade_type: TipoEntidade;
    }
  | {
      name: "entidade_link_clicked";
      entidade_name: string;
      entidade_type: TipoEntidade;
      link_type: "instagram" | "linkedin" | "website";
    };

export type CalendarEvent =
  | {
      name: "calendar_export_image_click";
    }
  | {
      name: "calendar_export_calendar_click";
    }
  | {
      name: "calendar_add_google_calendar_click";
    };

// Union of all PostHog events
export type PostHogEvent = UIInteractionEvent | EntidadesEvent | CalendarEvent;
