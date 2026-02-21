"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { usuariosService } from "@/lib/client/api/usuarios";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/client/utils";

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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !token) {
      return;
    }
    setIsSaving(true);
    try {
      await usuariosService.updatePeriodoAtual(selected, token);
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
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
          <GraduationCap className="w-8 h-8 text-aquario-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Qual período você está cursando?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Selecione o período atual do seu curso.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {PERIODO_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            disabled={busy}
            onClick={() => setSelected(option.value)}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              "hover:border-aquario-primary/50",
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

      <Button onClick={handleConfirm} disabled={!selected || busy} size="lg" className="gap-2">
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Continuar
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}
