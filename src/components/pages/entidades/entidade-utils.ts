import { TipoEntidade } from "@/lib/shared/types";

/**
 * Get the badge variant for a given entity type
 */
export function getBadgeVariant(
  tipo: TipoEntidade
): "default" | "secondary" | "outline" | "destructive" {
  switch (tipo) {
    case "LABORATORIO":
      return "default";
    case "GRUPO":
      return "secondary";
    case "LIGA_ACADEMICA":
      return "outline";
    default:
      return "destructive";
  }
}

/**
 * Get the badge text for a given entity type
 */
export function getBadgeText(tipo: string): string {
  switch (tipo) {
    case "LABORATORIO":
      return "LAB";
    case "GRUPO":
      return "GRUPO";
    case "LIGA_ACADEMICA":
      return "LIGA";
    case "CENTRO_ACADEMICO":
      return "CA";
    case "ATLETICA":
      return "ATLETICA";
    case "EMPRESA":
      return "EMPRESA";
    default:
      return "OUTRO";
  }
}

/**
 * Format entity type for display
 */
export function formatEntityType(tipo: TipoEntidade): string {
  return tipo.replace("_", " ");
}
