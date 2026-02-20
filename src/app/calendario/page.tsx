"use client";

import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useSemestreAtivo } from "@/lib/client/hooks/use-calendario-academico";
import { MinhasDisciplinas } from "@/components/pages/calendario/minhas-disciplinas";
import { PaasExplorer } from "@/components/pages/calendario/paas-explorer";

function MinhasDisciplinasView() {
  const { data: user } = useCurrentUser();
  const { data: semestreAtivo } = useSemestreAtivo();
  const centroSigla = user?.centro?.sigla ?? "CI";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
          Minhas Disciplinas
          {semestreAtivo?.nome && (
            <span className="text-2xl md:text-3xl font-normal text-muted-foreground ml-3">
              {semestreAtivo.nome}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas disciplinas e visualize seu calendário
        </p>
      </div>
      <MinhasDisciplinas centroSigla={centroSigla} semestreNome={semestreAtivo?.nome} />
    </div>
  );
}

export default function CalendarioPage() {
  const { token } = useAuth();
  const isLoggedIn = !!token;

  if (isLoggedIn) {
    return <MinhasDisciplinasView />;
  }

  return <PaasExplorer />;
}
