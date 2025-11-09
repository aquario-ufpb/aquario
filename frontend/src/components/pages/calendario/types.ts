import type { PaasClass } from "@/lib/types";

export type ClassWithRoom = PaasClass & {
  room: {
    bloco: string;
    nome: string;
  };
};
