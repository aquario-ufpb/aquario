import type { CopaTeam } from "./types";

// 48 seleções da Copa do Mundo FIFA 2026, conforme o sorteio final.
// flagCode segue o padrão do flagcdn.com (ISO 3166-1 alfa-2, mais subdivisões gb-eng / gb-sct).

export const COPA_TEAMS: CopaTeam[] = [
  // Grupo A
  { id: "MEX", nome: "México", flagCode: "mx", grupo: "A" },
  { id: "RSA", nome: "África do Sul", flagCode: "za", grupo: "A" },
  { id: "KOR", nome: "Coreia do Sul", flagCode: "kr", grupo: "A" },
  { id: "CZE", nome: "Tchéquia", flagCode: "cz", grupo: "A" },

  // Grupo B
  { id: "CAN", nome: "Canadá", flagCode: "ca", grupo: "B" },
  { id: "BIH", nome: "Bósnia e Herzegovina", flagCode: "ba", grupo: "B" },
  { id: "QAT", nome: "Catar", flagCode: "qa", grupo: "B" },
  { id: "SUI", nome: "Suíça", flagCode: "ch", grupo: "B" },

  // Grupo C
  { id: "BRA", nome: "Brasil", flagCode: "br", grupo: "C" },
  { id: "MAR", nome: "Marrocos", flagCode: "ma", grupo: "C" },
  { id: "HAI", nome: "Haiti", flagCode: "ht", grupo: "C" },
  { id: "SCO", nome: "Escócia", flagCode: "gb-sct", grupo: "C" },

  // Grupo D
  { id: "USA", nome: "Estados Unidos", flagCode: "us", grupo: "D" },
  { id: "PAR", nome: "Paraguai", flagCode: "py", grupo: "D" },
  { id: "AUS", nome: "Austrália", flagCode: "au", grupo: "D" },
  { id: "TUR", nome: "Turquia", flagCode: "tr", grupo: "D" },

  // Grupo E
  { id: "GER", nome: "Alemanha", flagCode: "de", grupo: "E" },
  { id: "CUW", nome: "Curaçao", flagCode: "cw", grupo: "E" },
  { id: "CIV", nome: "Costa do Marfim", flagCode: "ci", grupo: "E" },
  { id: "ECU", nome: "Equador", flagCode: "ec", grupo: "E" },

  // Grupo F
  { id: "NED", nome: "Países Baixos", flagCode: "nl", grupo: "F" },
  { id: "JPN", nome: "Japão", flagCode: "jp", grupo: "F" },
  { id: "SWE", nome: "Suécia", flagCode: "se", grupo: "F" },
  { id: "TUN", nome: "Tunísia", flagCode: "tn", grupo: "F" },

  // Grupo G
  { id: "BEL", nome: "Bélgica", flagCode: "be", grupo: "G" },
  { id: "EGY", nome: "Egito", flagCode: "eg", grupo: "G" },
  { id: "IRN", nome: "Irã", flagCode: "ir", grupo: "G" },
  { id: "NZL", nome: "Nova Zelândia", flagCode: "nz", grupo: "G" },

  // Grupo H
  { id: "ESP", nome: "Espanha", flagCode: "es", grupo: "H" },
  { id: "CPV", nome: "Cabo Verde", flagCode: "cv", grupo: "H" },
  { id: "KSA", nome: "Arábia Saudita", flagCode: "sa", grupo: "H" },
  { id: "URU", nome: "Uruguai", flagCode: "uy", grupo: "H" },

  // Grupo I
  { id: "FRA", nome: "França", flagCode: "fr", grupo: "I" },
  { id: "SEN", nome: "Senegal", flagCode: "sn", grupo: "I" },
  { id: "IRQ", nome: "Iraque", flagCode: "iq", grupo: "I" },
  { id: "NOR", nome: "Noruega", flagCode: "no", grupo: "I" },

  // Grupo J
  { id: "ARG", nome: "Argentina", flagCode: "ar", grupo: "J" },
  { id: "ALG", nome: "Argélia", flagCode: "dz", grupo: "J" },
  { id: "AUT", nome: "Áustria", flagCode: "at", grupo: "J" },
  { id: "JOR", nome: "Jordânia", flagCode: "jo", grupo: "J" },

  // Grupo K
  { id: "POR", nome: "Portugal", flagCode: "pt", grupo: "K" },
  { id: "COD", nome: "RD Congo", flagCode: "cd", grupo: "K" },
  { id: "UZB", nome: "Uzbequistão", flagCode: "uz", grupo: "K" },
  { id: "COL", nome: "Colômbia", flagCode: "co", grupo: "K" },

  // Grupo L
  { id: "ENG", nome: "Inglaterra", flagCode: "gb-eng", grupo: "L" },
  { id: "CRO", nome: "Croácia", flagCode: "hr", grupo: "L" },
  { id: "GHA", nome: "Gana", flagCode: "gh", grupo: "L" },
  { id: "PAN", nome: "Panamá", flagCode: "pa", grupo: "L" },
];

const TEAMS_BY_ID = new Map(COPA_TEAMS.map(team => [team.id, team]));

export function getCopaTeam(id: string | null | undefined): CopaTeam | undefined {
  if (!id) {
    return undefined;
  }
  return TEAMS_BY_ID.get(id);
}

export const COPA_GROUP_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;
