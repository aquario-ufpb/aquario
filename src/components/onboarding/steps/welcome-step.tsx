"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import Image from "next/image";
import { ArrowRight, Loader2, Github } from "lucide-react";
import type { SemestreLetivo } from "@/lib/shared/types/calendario.types";

type WelcomeStepProps = {
  page: 1 | 2;
  onPageChange: (page: 1 | 2) => void;
  onComplete: () => Promise<void>;
  isMutating: boolean;
  semestreAtivo?: SemestreLetivo;
};

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

const CONTRIBUTION_LEVELS = [
  "bg-emerald-100 dark:bg-emerald-900/40",
  "bg-emerald-300 dark:bg-emerald-700/60",
  "bg-emerald-500 dark:bg-emerald-500/70",
  "bg-emerald-700 dark:bg-emerald-400/80",
];

function FakeContributionGrid() {
  const grid = useMemo(() => {
    // 7 rows (days) x 20 columns (weeks) — seeded pseudo-random
    const cells: number[] = [];
    let seed = 42;
    for (let i = 0; i < 7 * 20; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      const val = seed % 10;
      // ~35% empty, ~25% level 1, ~20% level 2, ~12% level 3, ~8% level 4
      if (val < 3) {
        cells.push(0);
      } else if (val < 5) {
        cells.push(1);
      } else if (val < 7) {
        cells.push(2);
      } else if (val < 9) {
        cells.push(3);
      } else {
        cells.push(4);
      }
    }
    return cells;
  }, []);

  return (
    <div className="inline-flex flex-col gap-[3px]">
      {Array.from({ length: 7 }).map((_, row) => (
        <div key={row} className="flex gap-[3px]">
          {Array.from({ length: 20 }).map((_, col) => {
            const level = grid[row + col * 7];
            return (
              <div
                key={col}
                className={`w-[11px] h-[11px] rounded-[2px] ${
                  level === 0 ? "bg-muted" : CONTRIBUTION_LEVELS[(level ?? 1) - 1]
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function WelcomeStep({
  page,
  onPageChange,
  onComplete,
  isMutating,
  semestreAtivo,
}: WelcomeStepProps) {
  const { data: user } = useCurrentUser();
  const firstName = user ? getFirstName(user.nome) : null;

  if (page === 2) {
    return (
      <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-aquario-primary/10 flex items-center justify-center">
            <Github className="w-8 h-8 text-aquario-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Projeto Open Source</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            O Aquário é um projeto open source licenciado sob a Licença MIT. Qualquer pessoa pode
            contribuir para tornar a plataforma melhor — seja você calouro ou veterano.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <FakeContributionGrid />
        </div>

        <div className="pt-1">
          <p className="text-sm font-semibold mb-4">Nossos Contribuidores</p>
          <a
            href="https://github.com/aquario-ufpb/aquario/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-105"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://contrib.rocks/image?repo=aquario-ufpb/aquario"
              alt="Contribuidores do Aquário"
              className="max-w-md mx-auto rounded-xl"
            />
          </a>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <ContributeOnGitHub
            url="https://github.com/aquario-ufpb/aquario"
            variant="outline"
            size="sm"
          />
          <Button onClick={onComplete} disabled={isMutating} size="lg" className="gap-2">
            {isMutating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Começar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const isOutro = user?.centro?.sigla === "OUTRO";

  return (
    <div className="text-center space-y-6 py-6">
      <div className="flex justify-center">
        <Image src="/logo.png" alt="Aquário" width={80} height={80} className="rounded-2xl" />
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold">
          {firstName ? `Bem-vindo ao Aquário, ${firstName}!` : "Bem-vindo ao Aquário!"}
        </h2>
        {isOutro ? (
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            O Aquário foi feito para o Centro de Informática da UFPB, mas ficamos felizes em ter
            você aqui! Vamos configurar seu perfil em poucos passos.
          </p>
        ) : (
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            Que bom ter você aqui. Vamos configurar seu perfil do Aquário em poucos passos para
            personalizar sua experiência.
          </p>
        )}
      </div>

      {user && !isOutro && (
        <p className="text-sm text-muted-foreground">
          Seu curso: <span className="font-medium">{user.curso.nome}</span>
          {semestreAtivo && (
            <>
              {" — "}Semestre atual: <span className="font-medium">{semestreAtivo.nome}</span>
            </>
          )}
        </p>
      )}

      <Button onClick={() => onPageChange(2)} size="lg" className="gap-2">
        Próximo
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
