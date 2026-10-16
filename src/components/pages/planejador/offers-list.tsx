"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHorario } from "@/lib/shared/calendario/utils";
import { reservedFor } from "@/lib/shared/planner/solver";
import type { PlannerOffer } from "@/lib/shared/planner/types";

export function OffersList({
  offers,
  courseId,
  fixed,
  onPin,
  onRemove,
}: {
  offers: PlannerOffer[];
  courseId: string | null;
  fixed: string[];
  onPin: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [limit, setLimit] = useState(12);
  const needle = search
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const filtered = offers.filter(offer =>
    `${offer.code} ${offer.name} ${offer.teacher} ${offer.section}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(needle)
  );
  return (
    <div className="space-y-3">
      <Label htmlFor="offer-search">Buscar nas turmas carregadas</Label>
      <Input
        id="offer-search"
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setLimit(12);
        }}
        placeholder="Disciplina, código, turma ou docente"
      />
      <p className="text-xs text-muted-foreground">
        {filtered.length} turmas · reservas se referem ao curso selecionado
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, limit).map(offer => (
          <article key={offer.id} className="rounded-lg border p-4 space-y-2 min-w-0">
            <h3 className="text-sm font-semibold break-words">{offer.name}</h3>
            <p className="text-xs">
              {offer.code} · Turma {offer.section} · {offer.semester}
            </p>
            <p className="text-sm">{formatHorario(offer.schedule)}</p>
            <p className="text-xs text-muted-foreground">
              {offer.teacher || "Docente não informado"}
            </p>
            <dl className="text-xs space-y-1">
              <div>
                <dt className="inline font-medium">Reservadas para o curso: </dt>
                <dd className="inline">{reservedFor(offer, courseId) ?? "Não informado"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Vagas disponíveis: </dt>
                <dd className="inline">{offer.availableSeats ?? "Não informado"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Vagas ofertadas / solicitações: </dt>
                <dd className="inline">
                  {offer.totalSeats ?? "Não informado"} / {offer.demand ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Local: </dt>
                <dd className="inline">{offer.location ?? "A verificar"}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              {offer.source === "SIGAA" ? "SIGAA" : "Personalizada"} ·{" "}
              {new Date(offer.observedAt).toLocaleString("pt-BR", { timeZone: "America/Recife" })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={fixed.includes(offer.id) ? "default" : "outline"}
                aria-pressed={fixed.includes(offer.id)}
                onClick={() => onPin(offer.id)}
              >
                {fixed.includes(offer.id) ? "Turma fixada" : "Manter esta turma"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onRemove(offer.id)}>
                Remover da simulação
              </Button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length > limit && (
        <Button variant="outline" onClick={() => setLimit(value => value + 12)}>
          Mostrar mais turmas
        </Button>
      )}
    </div>
  );
}
