"use client";

import { useMemo, useState } from "react";
import { useEntidades, useMyMemberships, useCreateOwnMembership } from "@/lib/client/hooks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, Users, X } from "lucide-react";
import { toast } from "sonner";
import type { Entidade } from "@/lib/shared/types";

// prettier-ignore
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function MonthYearPicker({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string; // "YYYY-MM" or ""
  onChange: (val: string) => void;
  optional?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i);

  const initMonth = value ? value.split("-")[1] : undefined;
  const initYear = value ? value.split("-")[0] : undefined;
  const [localMonth, setLocalMonth] = useState<string | undefined>(initMonth);
  const [localYear, setLocalYear] = useState<string | undefined>(initYear);

  const handleMonthChange = (m: string) => {
    setLocalMonth(m);
    if (localYear) {
      onChange(`${localYear}-${m}`);
    }
  };

  const handleYearChange = (y: string) => {
    setLocalYear(y);
    if (localMonth) {
      onChange(`${y}-${localMonth}`);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {optional && " (opcional)"}
      </span>
      <div className="flex gap-1">
        <Select value={localMonth} onValueChange={handleMonthChange}>
          <SelectTrigger
            aria-label={`${label}: mês`}
            className="min-h-11 w-[76px] px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, i) => (
              <SelectItem key={i} value={String(i + 1).padStart(2, "0")} className="min-h-11">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={localYear} onValueChange={handleYearChange}>
          <SelectTrigger
            aria-label={`${label}: ano`}
            className="min-h-11 w-[80px] px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)} className="min-h-11">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function toISOFromMonth(monthStr: string): string {
  // "2024-03" → "2024-03-01T00:00:00.000Z"
  return new Date(`${monthStr}-01T00:00:00Z`).toISOString();
}

function EntidadeCard({
  entidade,
  isMember,
  isPending,
  onJoin,
}: {
  entidade: Entidade;
  isMember: boolean;
  isPending: boolean;
  onJoin: (entidadeId: string, startedAt: string, endedAt: string | null) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const formId = `entidade-membership-${entidade.id}`;

  const handleConfirm = async () => {
    if (!startMonth) {
      toast.error("Selecione o mês de entrada.");
      return;
    }
    await onJoin(
      entidade.id,
      toISOFromMonth(startMonth),
      endMonth ? toISOFromMonth(endMonth) : null
    );
    setExpanded(false);
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="p-3 flex items-start gap-3">
        {entidade.imagePath ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={entidade.imagePath}
            alt={entidade.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Users aria-hidden="true" className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{entidade.name}</p>
          {entidade.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{entidade.subtitle}</p>
          )}
        </div>
        {isMember ? (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 flex-shrink-0">
            <Check aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Membro</span>
          </div>
        ) : expanded ? (
          <button
            type="button"
            aria-label={`Fechar opções de participação em ${entidade.name}`}
            aria-expanded="true"
            aria-controls={formId}
            onClick={() => setExpanded(false)}
            className="flex h-11 w-11 flex-shrink-0 touch-manipulation items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-expanded="false"
            aria-controls={formId}
            className="min-h-11 flex-shrink-0 text-xs"
            onClick={() => setExpanded(true)}
            disabled={isPending}
          >
            Participar
          </Button>
        )}
      </div>

      {expanded && !isMember && (
        <div id={formId} className="flex flex-wrap items-end gap-3 border-t px-3 py-3">
          <MonthYearPicker label="Entrada" value={startMonth} onChange={setStartMonth} />
          <MonthYearPicker label="Saída" value={endMonth} onChange={setEndMonth} optional />
          <Button
            size="sm"
            className="min-h-11 text-xs"
            onClick={handleConfirm}
            disabled={isPending || !startMonth}
          >
            {isPending ? (
              <>
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                />
                <span className="sr-only">Salvando…</span>
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

type EntidadeGroup = { label: string; items: Entidade[] };

function groupEntidades(entidades: Entidade[]): EntidadeGroup[] {
  const laboratorios = entidades.filter(e => e.tipo === "LABORATORIO");
  const gruposELigas = entidades.filter(
    e => e.tipo === "GRUPO" || e.tipo === "LIGA_ACADEMICA" || e.tipo === "OUTRO"
  );
  const centrosEAtleticas = entidades.filter(
    e => e.tipo === "CENTRO_ACADEMICO" || e.tipo === "ATLETICA"
  );
  const empresas = entidades.filter(e => e.tipo === "EMPRESA");

  return [
    { label: "Laboratórios", items: laboratorios },
    { label: "Grupos e Ligas", items: gruposELigas },
    { label: "Centros Acadêmicos e Atléticas", items: centrosEAtleticas },
    { label: "Empresas Parceiras", items: empresas },
  ].filter(g => g.items.length > 0);
}

export function EntidadesStep() {
  const { data: entidades = [], isLoading: entidadesLoading } = useEntidades();
  const { data: memberships = [] } = useMyMemberships();
  const createMembership = useCreateOwnMembership();

  const memberEntidadeIds = useMemo(
    () => new Set(memberships.map(m => m.entidade.id)),
    [memberships]
  );

  const groups = useMemo(() => groupEntidades(entidades), [entidades]);

  const handleJoin = async (entidadeId: string, startedAt: string, endedAt: string | null) => {
    if (endedAt && new Date(endedAt) < new Date(startedAt)) {
      toast.error("A data de saída não pode ser antes da data de entrada.");
      return;
    }
    try {
      await createMembership.mutateAsync({
        entidadeId,
        startedAt,
        endedAt,
      });
      toast.success("Agora você é membro!");
    } catch {
      toast.error("Erro ao participar da entidade.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-pretty text-xl font-bold">Entidades</h2>
        <p className="text-sm text-muted-foreground">
          Informe de quais entidades você faz ou já fez parte, e quando entrou e saiu.
        </p>
      </div>

      {entidadesLoading ? (
        <div className="text-center py-8">
          <Loader2
            aria-hidden="true"
            className="mx-auto h-6 w-6 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
          <span className="sr-only">Carregando entidades…</span>
        </div>
      ) : entidades.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users aria-hidden="true" className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma entidade disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map(entidade => (
                  <EntidadeCard
                    key={entidade.id}
                    entidade={entidade}
                    isMember={memberEntidadeIds.has(entidade.id)}
                    isPending={createMembership.isPending}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
