import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Monitor, Clock, DollarSign, ExternalLink } from "lucide-react";
import type { VagaFormData, VagaFormUpdater, EntidadeOption } from "./types";

const TIPO_VAGA_LABELS: Record<string, string> = {
  ESTAGIO: "Estágio",
  TRAINEE: "Trainee",
  VOLUNTARIO: "Voluntário",
  PESQUISA: "Pesquisa",
  CLT: "CLT",
  PJ: "PJ",
  OUTRO: "Outro",
};

type StepRevisaoProps = {
  data: VagaFormData;
  onChange: VagaFormUpdater;
  entidadeOptions: EntidadeOption[];
};

export function StepRevisao({ data, onChange, entidadeOptions }: StepRevisaoProps) {
  const selectedEntidade = entidadeOptions.find(e => e.id === data.entidadeId);
  const entidadeNome = selectedEntidade?.nome ?? "";
  const entidadeImage = selectedEntidade?.imagePath;
  const tipoLabel = data.tipoVaga ? TIPO_VAGA_LABELS[data.tipoVaga] : "";
  const dataFormatada = data.dataFinalizacao
    ? new Date(data.dataFinalizacao + "T12:00:00").toLocaleDateString("pt-BR")
    : "";

  return (
    <div className="flex flex-col gap-8">
      {/* Info adicional */}
      <div className="flex flex-col gap-1.5 w-full">
        <Label htmlFor="informacoesAdicionais">
          Informações adicionais{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Benefícios, diferenciais, observações ou qualquer outro detalhe relevante.
        </p>
        <Textarea
          id="informacoesAdicionais"
          value={data.informacoesAdicionais}
          onChange={e => onChange("informacoesAdicionais", e.target.value)}
          placeholder="Vale transporte, horário flexível, trabalho remoto..."
          rows={4}
        />
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground tracking-wide">
          Preview da vaga
        </h3>
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          {/* Hero */}
          <div className="p-6 pb-8">
            <div className="flex gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="w-16 h-16 rounded-xl border border-border/30">
                  <AvatarImage src={entidadeImage} alt={entidadeNome} className="object-cover" />
                  <AvatarFallback className="rounded-xl text-lg font-semibold bg-muted">
                    {entidadeNome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-3 min-w-0">
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">{entidadeNome}</p>
                  <h4 className="text-xl font-bold">{data.titulo || "Título da vaga"}</h4>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {tipoLabel && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
                    >
                      <Monitor className="w-3 h-3 mr-1" />
                      {tipoLabel}
                    </Badge>
                  )}
                  {data.areas.map(area => (
                    <Badge
                      key={area}
                      variant="outline"
                      className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {dataFormatada && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Encerra em <span className="text-foreground">{dataFormatada}</span>
                    </span>
                  )}
                  {data.salario && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-foreground">{data.salario}</span>
                    </span>
                  )}
                </div>

                {/* Apply button (decorative) */}
                {data.linkInscricao && (
                  <div>
                    <Button size="sm" className="rounded-full pointer-events-none" tabIndex={-1}>
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sections */}
          {data.sobreEmpresa && (
            <PreviewSection title="Sobre a empresa">
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {data.sobreEmpresa}
              </p>
            </PreviewSection>
          )}

          {data.descricao && (
            <PreviewSection title="Descrição da vaga">
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {data.descricao}
              </p>
            </PreviewSection>
          )}

          {data.responsabilidades.length > 0 && (
            <PreviewSection title="Responsabilidades">
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 leading-relaxed">
                {data.responsabilidades.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {data.requisitos.length > 0 && (
            <PreviewSection title="Requisitos">
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 leading-relaxed">
                {data.requisitos.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </PreviewSection>
          )}

          {data.etapasProcesso.length > 0 && (
            <PreviewSection title="Etapas do processo">
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1 leading-relaxed">
                {data.etapasProcesso.map((etapa, i) => (
                  <li key={i}>{etapa}</li>
                ))}
              </ol>
            </PreviewSection>
          )}

          {data.informacoesAdicionais && (
            <PreviewSection title="Informações adicionais">
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {data.informacoesAdicionais}
              </p>
            </PreviewSection>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 pb-6">
      <div className="border-t border-border/30 pt-5">
        <h5 className="text-sm font-semibold mb-3">{title}</h5>
        {children}
      </div>
    </div>
  );
}
