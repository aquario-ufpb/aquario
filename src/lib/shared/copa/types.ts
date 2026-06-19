// Tipos da Copa do Mundo FIFA 2026 (EUA · Canadá · México)
// Domínio em português, seguindo a convenção do projeto.

export type CopaGroupLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export type CopaStage =
  | "grupos" // Fase de grupos
  | "32avos" // Rodada de 32
  | "oitavas" // Oitavas de final
  | "quartas" // Quartas de final
  | "semis" // Semifinais
  | "terceiro" // Disputa de 3º lugar
  | "final"; // Final

export type CopaTeam = {
  /** Código curto estável (ex.: "BRA"). Usado como identificador interno. */
  id: string;
  /** Nome da seleção em português. */
  nome: string;
  /** Código para o flagcdn.com (ex.: "br", "gb-sct"). */
  flagCode: string;
  /** Grupo ao qual a seleção pertence. */
  grupo: CopaGroupLetter;
};

export type CopaMatch = {
  /** Número da partida (1 a 104). */
  id: number;
  /** Data e hora de início no fuso de Brasília (ISO 8601 com offset -03:00). */
  kickoff: string;
  /** Etapa da competição. */
  stage: CopaStage;
  /** Grupo (apenas para a fase de grupos). */
  grupo?: CopaGroupLetter;
  /** Id da seleção mandante, ou null quando ainda indefinida (mata-mata). */
  homeId: string | null;
  /** Id da seleção visitante, ou null quando ainda indefinida (mata-mata). */
  awayId: string | null;
  /** Texto exibido quando a seleção ainda é indefinida (ex.: "1A", "Vencedor 73"). */
  homeLabel?: string;
  /** Texto exibido quando a seleção ainda é indefinida (ex.: "2B", "Vencedor 74"). */
  awayLabel?: string;
  /** Estádio. */
  venue: string;
  /** Cidade-sede. */
  city: string;
};
