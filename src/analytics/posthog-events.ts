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
import type { OnboardingStepId } from "@/lib/shared/types/onboarding.types";

// UI Interaction events
export type UIInteractionEvent = {
  name: "github_button_clicked";
};

export type AuthEvent =
  | { name: "login_attempted" }
  | { name: "login_succeeded" }
  | { name: "login_failed"; error_type: string }
  | { name: "register_attempted" }
  | { name: "register_succeeded" }
  | { name: "register_failed"; error_type: string }
  | { name: "forgot_password_submitted" }
  | { name: "reset_password_submitted" }
  | { name: "reset_password_succeeded" }
  | { name: "email_verification_succeeded" }
  | { name: "email_verification_resent" };

export type SobreEvent = {
  name: "sobre_contact_clicked";
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
    }
  | {
      name: "entidade_detail_viewed";
      entidade_name: string;
      entidade_type: TipoEntidade;
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

export type CalendarioAcademicoEvent =
  | { name: "calendario_academico_view_changed"; view: "lista" | "calendario" }
  | { name: "calendario_academico_semestre_changed"; semestre_nome: string };

export type GradesCurricularesEvent = {
  name: "grade_curricular_curso_selected";
  curso_nome: string;
};

export type MapasEvent = {
  name: "mapa_room_clicked";
  room_name: string;
  building_name: string;
};

export type GuiasEvent = {
  name: "guia_section_viewed";
  guia_slug: string;
  section_slug: string;
  subsection_slug?: string;
};

export type UsuariosEvent = {
  name: "usuario_profile_viewed";
  user_slug: string;
};

export type OnboardingEvent =
  | { name: "onboarding_step_viewed"; step_id: OnboardingStepId }
  | { name: "onboarding_step_completed"; step_id: OnboardingStepId }
  | { name: "onboarding_step_skipped"; step_id: OnboardingStepId };

// Union of all PostHog events
export type PostHogEvent =
  | UIInteractionEvent
  | AuthEvent
  | SobreEvent
  | EntidadesEvent
  | CalendarEvent
  | CalendarioAcademicoEvent
  | GradesCurricularesEvent
  | MapasEvent
  | GuiasEvent
  | UsuariosEvent
  | OnboardingEvent;
