import type { PaasClass } from "@/lib/shared/types";

export type ClassWithRoom = PaasClass & {
  room: {
    bloco: string;
    nome: string;
  };
};
