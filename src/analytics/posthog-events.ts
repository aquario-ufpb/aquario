/**
 * Strongly-typed PostHog event definitions
 *
 * This file contains ALL PostHog events we send, providing compile-time type safety
 * and a single source of truth for all analytics events.
 *
 * To add a new event: just add it to the PostHogEvent union type below
 * and TypeScript will enforce the correct usage everywhere.
 */

import type { TipoEntidade } from "@/lib/shared/types/entidade.types";
import type { OnboardingStepId } from "@/lib/shared/types/onboarding.types";

// UI Interaction events
type UIInteractionEvent = {
  name: "github_button_clicked";
  location?: "landing_hero" | "landing_footer";
};

type AuthEvent =
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

type SobreEvent = {
  name: "sobre_contact_clicked";
};

type EntidadesEvent =
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

type CalendarEvent =
  | {
      name: "calendar_export_image_click";
    }
  | {
      name: "calendar_export_calendar_click";
    }
  | {
      name: "calendar_add_google_calendar_click";
    };

type CalendarioAcademicoEvent =
  | { name: "calendario_academico_view_changed"; view: "lista" | "calendario" }
  | { name: "calendario_academico_semestre_changed"; semestre_nome: string };

type GradesCurricularesEvent =
  | { name: "grade_curricular_curso_selected"; curso_nome: string }
  | { name: "grade_curricular_export_image_click" };

type MapasEvent = {
  name: "mapa_room_clicked";
  room_name: string;
  building_name: string;
};

type GuiasEvent = {
  name: "guia_section_viewed";
  guia_slug: string;
  section_slug: string;
  subsection_slug?: string;
};

type UsuariosEvent = {
  name: "usuario_profile_viewed";
  user_slug: string;
};

type OnboardingEvent =
  | { name: "onboarding_step_viewed"; step_id: OnboardingStepId }
  | { name: "onboarding_step_completed"; step_id: OnboardingStepId }
  | { name: "onboarding_step_skipped"; step_id: OnboardingStepId };

export type SigaaFlowOperation = "connect" | "sync" | "course_change";
export type SigaaConnectionState = "never_connected" | "pending" | "connected" | "disconnected";
export type SigaaDiscoveryConnectionState = SigaaConnectionState | "error" | "unknown";
export type SigaaSensitiveAction = "disconnect" | "delete";

type SigaaEvent =
  | {
      name: "sigaa_connect_opened";
      operation: "connect" | "sync";
      consent_required: boolean;
    }
  | {
      name: "sigaa_connect_started";
      operation: SigaaFlowOperation;
      consent_required: boolean;
    }
  | {
      name: "sigaa_connect_succeeded";
      operation: SigaaFlowOperation;
      course_replaced: boolean;
    }
  | { name: "sigaa_connect_failed"; operation: SigaaFlowOperation }
  | { name: "sigaa_course_change_shown" }
  | { name: "sigaa_course_change_confirmed" }
  | { name: "sigaa_academic_page_opened"; connection_state: SigaaConnectionState }
  | { name: "sigaa_sync_again_clicked"; connection_state: SigaaConnectionState }
  | {
      name: "sigaa_entrypoint_clicked";
      location:
        | "desktop_user_menu"
        | "mobile_user_menu"
        | "desktop_resources"
        | "mobile_resources"
        | "landing";
      connection_state: SigaaDiscoveryConnectionState;
    }
  | { name: "sigaa_highlight_viewed" }
  | {
      name: "sigaa_mcp_clicked";
      location: "desktop_resources" | "mobile_menu" | "resources_page" | "landing";
    }
  | { name: "sigaa_sensitive_action_opened"; action: SigaaSensitiveAction }
  | { name: "sigaa_sensitive_action_started"; action: SigaaSensitiveAction }
  | { name: "sigaa_sensitive_action_succeeded"; action: SigaaSensitiveAction }
  | { name: "sigaa_sensitive_action_failed"; action: SigaaSensitiveAction };

export type ProjetoStatus = "PUBLICADO" | "RASCUNHO" | "ARQUIVADO";

type ProjetosEvent =
  | {
      name: "projetos_list_viewed";
      tab: "PUBLICADO" | "MEUS_PUBLICADOS" | "RASCUNHO" | "ARQUIVADO";
    }
  | {
      name: "projeto_viewed";
      projeto_slug: string;
      status: ProjetoStatus;
    }
  | {
      name: "projeto_link_clicked";
      projeto_slug: string;
      link_type: "repositorio" | "prototipo" | "outro";
    }
  | { name: "projeto_create_clicked"; logged_in: boolean }
  | { name: "projeto_created"; projeto_slug: string; posted_as: "user" | "entidade" }
  | { name: "projeto_edited"; projeto_slug: string; status: ProjetoStatus }
  | { name: "projeto_archived"; projeto_slug: string }
  | { name: "projeto_unarchived"; projeto_slug: string };

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
  | OnboardingEvent
  | SigaaEvent
  | ProjetosEvent;
