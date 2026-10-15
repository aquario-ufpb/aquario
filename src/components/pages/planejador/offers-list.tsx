"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHorario } from "@/lib/shared/calendario/utils";
import { reservedFor } from "@/lib/shared/planner/solver";
import type { PlannerOffer } from "@/lib/shared/planner/types";

function LocationEditor({
  offer,
  onChange,
}: {
  offer: PlannerOffer;
  onChange: (offer: PlannerOffer) => void;
}) {
  const [error, setError] = useState("");
  return (
    <details className="text-xs">
      <summary className="cursor-pointer py-1">Informar local e coordenadas</summary>
      <form
        className="space-y-2 pt-2"
        onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const location = String(data.get("location") ?? "").trim();
          const lat = String(data.get("lat") ?? "");
          const lng = String(data.get("lng") ?? "");
          const coords = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
          if (
            (lat && !lng) ||
            (!lat && lng) ||
            (coords &&
              (!Number.isFinite(coords.lat) ||
                !Number.isFinite(coords.lng) ||
                Math.abs(coords.lat) > 90 ||
                Math.abs(coords.lng) > 180))
          ) {
            setError("Informe latitude e longitude válidas, ou deixe ambas vazias.");
            return;
          }
          onChange({ ...offer, location: location || null, coordinates: coords });
          setError("");
        }}
      >
        <Label htmlFor={`${offer.id}-location`}>Local informado por você</Label>
        <Input
          id={`${offer.id}-location`}
          name="location"
          defaultValue={offer.location ?? ""}
          placeholder="Ex.: CI / Mangabeira"
          maxLength={256}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${offer.id}-lat`}>Latitude</Label>
            <Input
              id={`${offer.id}-lat`}
              name="lat"
              defaultValue={offer.coordinates?.lat ?? ""}
              type="number"
              step="any"
              min={-90}
              max={90}
            />
          </div>
          <div>
            <Label htmlFor={`${offer.id}-lng`}>Longitude</Label>
            <Input
              id={`${offer.id}-lng`}
              name="lng"
              defaultValue={offer.coordinates?.lng ?? ""}
              type="number"
              step="any"
              min={-180}
              max={180}
            />
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" size="sm" variant="outline">
          Aplicar local ao cenário
        </Button>
      </form>
    </details>
  );
}
export function OffersList({
  offers,
  courseId,
  fixed,
  onPin,
  onChange,
  onRemove,
}: {
  offers: PlannerOffer[];
  courseId: string | null;
  fixed: string[];
  onPin: (id: string) => void;
  onChange: (offer: PlannerOffer) => void;
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
        {filtered.length} turmas · reservas se referem ao curso selecionado · local editado nesta
        tela é informado por você
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
            <LocationEditor
              key={`${offer.id}:${offer.location}:${JSON.stringify(offer.coordinates)}`}
              offer={offer}
              onChange={onChange}
            />
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
