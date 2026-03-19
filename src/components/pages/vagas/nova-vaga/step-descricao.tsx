import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { VagaFormData, VagaFormUpdater } from "./types";

type StepDescricaoProps = {
  data: VagaFormData;
  onChange: VagaFormUpdater;
};

export function StepDescricao({ data, onChange }: StepDescricaoProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descricao">Descrição da vaga</Label>
        <p className="text-sm text-muted-foreground">
          O que a pessoa vai fazer, o que precisa saber e por que essa vaga vale a pena.
        </p>
        <Textarea
          id="descricao"
          value={data.descricao}
          onChange={e => onChange("descricao", e.target.value)}
          placeholder="Seja direto, mas não chato. Boas vagas têm boas descrições."
          rows={8}
        />
      </div>

      {/* Sobre a empresa */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sobreEmpresa">
          Sobre a empresa <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Contexto sobre a organização que está abrindo a vaga.
        </p>
        <Textarea
          id="sobreEmpresa"
          value={data.sobreEmpresa}
          onChange={e => onChange("sobreEmpresa", e.target.value)}
          placeholder="Quem somos, o que fazemos, qual o nosso propósito..."
          rows={4}
        />
      </div>
    </div>
  );
}
