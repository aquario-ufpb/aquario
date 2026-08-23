"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { usuariosService } from "@/lib/client/api/usuarios";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";

type PeriodoStepProps = {
  onComplete: () => Promise<void>;
  isMutating: boolean;
};

const PERIODO_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "12+", label: "12+" },
  { value: "concluido", label: "Já estou graduado" },
] as const;

export function PeriodoStep({ onComplete, isMutating }: PeriodoStepProps) {
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const canUseSigaa = user?.permissoes.includes("sigaa:beta") ?? false;
  const sigaaQuery = useOwnSigaaAcademicState(canUseSigaa);
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !token) {
      return;
    }
    setIsSaving(true);
    try {
      await usuariosService.updatePeriodoAtual(selected, token);
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current(userId) });
      await onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isMutating || isSaving;

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-aquario-primary/10 flex items-center justify-center">
          <GraduationCap aria-hidden="true" className="w-8 h-8 text-aquario-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-pretty text-2xl font-bold">Qual período você está cursando?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Selecione o período atual do seu curso.
        </p>
      </div>

      {sigaaQuery.data?.snapshot && (
        <div className="mx-auto max-w-md rounded-lg border bg-muted/30 p-3 text-left text-sm">
          <p className="font-medium">Confirme seu período curricular</p>
          <p className="mt-1 text-muted-foreground">
            O SIGAA informou o semestre letivo{" "}
            {sigaaQuery.data.snapshot.payload.identity.sourceSemester ?? "atual"}, mas isso não
            permite descobrir com segurança o período do seu curso. Escolha abaixo a opção que
            corresponde à sua situação.
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {PERIODO_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            disabled={busy}
            onClick={() => setSelected(option.value)}
            className={cn(
              "min-h-11 min-w-11 touch-manipulation px-4 py-2 rounded-lg border text-sm font-medium transition-[border-color,background-color,box-shadow] motion-reduce:transition-none",
              "hover:border-aquario-primary/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected === option.value
                ? "border-aquario-primary bg-aquario-primary/10 text-aquario-primary ring-2 ring-aquario-primary/30"
                : "border-border bg-background text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!selected || busy}
        size="lg"
        className="min-h-11 gap-2"
      >
        {busy ? (
          <>
            <Loader2
              aria-hidden="true"
              className="w-4 h-4 animate-spin motion-reduce:animate-none"
            />
            <span className="sr-only">Salvando…</span>
          </>
        ) : (
          <>
            Continuar
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}
