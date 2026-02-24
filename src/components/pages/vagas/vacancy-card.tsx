import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { mapImagePath } from "@/lib/client/api/entidades";
import { Monitor, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Vaga } from "@/lib/shared/types";

type VacancyCardProps = {
  vaga: Vaga;
  variant?: "list" | "grid";
};

function getEntidadeLabel(entidade: Vaga["entidade"]): string {
  if (typeof entidade === "object") return entidade.nome;
  const labels: Record<string, string> = {
    laboratorios: "Laboratório",
    grupos: "Grupo",
    ufpb: "UFPB",
    pessoa: "Pessoa",
    externo: "Externo",
    ligas: "Liga",
  };
  return labels[entidade] ?? entidade;
}

function getTipoVagaLabel(tipo: string): string {
  return tipo.replace(/_/g, " ");
}

function formatDataFim(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function VacancyCard({ vaga, variant = "list" }: VacancyCardProps) {
  const { titulo, tipoVaga, entidade, dataFinalizacao } = vaga;
  const entidadeLabel = getEntidadeLabel(entidade);
  const entidadeNome = typeof entidade === "object" ? entidade.nome : entidadeLabel;
  const entidadeAvatarSrc =
    typeof entidade === "object"
      ? mapImagePath("urlFoto" in entidade ? entidade.urlFoto : undefined)
      : getDefaultAvatarUrl(entidadeNome, entidadeNome);
  const dataFimStr = formatDataFim(dataFinalizacao);

  if (variant === "grid") {
    return (
      <Card className="hover:bg-accent/20 transition-all duration-200 cursor-pointer h-full border-border/90">
        <CardContent className="flex flex-col items-center text-center p-6 gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={entidadeAvatarSrc} alt={entidadeNome} />
            <AvatarFallback>{entidadeNome.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center gap-1 w-full">
            <h3 className="text-base font-semibold line-clamp-2 leading-snug">{titulo}</h3>
            {dataFimStr && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Encerra em {dataFimStr}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
            >
              {entidadeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
            >
              {getTipoVagaLabel(tipoVaga)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:bg-accent/20 transition-all duration-200 cursor-pointer border-border/90">
      <CardContent className="flex flex-row items-center p-4 gap-4">
        <div className="flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={entidadeAvatarSrc} alt={entidadeNome} />
            <AvatarFallback>{entidadeNome.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-semibold truncate">{titulo}</h3>
              {dataFimStr && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarDays className="w-3 h-3 flex-shrink-0" />
                  Encerra em {dataFimStr}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
              >
                {entidadeLabel}
              </Badge>
              <div className="flex items-center text-muted-foreground text-xs">
                <Monitor className="w-3.5 h-3.5 mr-1" />
                <span>{getTipoVagaLabel(tipoVaga)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
