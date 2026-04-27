import { useState } from "react";
import { Label } from "@/components/ui/label";
import { DynamicList } from "./dynamic-list";
import type { VagaFormData, VagaFormUpdater } from "./types";

type StepProcessoProps = {
  data: VagaFormData;
  onChange: VagaFormUpdater;
};

export function StepProcesso({ data, onChange }: StepProcessoProps) {
  const [responsabilidadeInput, setResponsabilidadeInput] = useState("");
  const [requisitoInput, setRequisitoInput] = useState("");
  const [etapaInput, setEtapaInput] = useState("");

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Responsabilidades */}
      <div className="flex flex-col gap-2">
        <Label>Responsabilidades</Label>
        <p className="text-sm text-muted-foreground mb-1">O que a pessoa vai fazer no dia a dia.</p>
        <DynamicList
          items={data.responsabilidades}
          inputValue={responsabilidadeInput}
          onInputChange={setResponsabilidadeInput}
          onAdd={() => {
            if (responsabilidadeInput.trim()) {
              onChange("responsabilidades", [
                ...data.responsabilidades,
                responsabilidadeInput.trim(),
              ]);
              setResponsabilidadeInput("");
            }
          }}
          onRemove={i =>
            onChange(
              "responsabilidades",
              data.responsabilidades.filter((_, idx) => idx !== i)
            )
          }
          placeholder="Ex: Desenvolver e manter features do produto"
        />
      </div>

      {/* Requisitos */}
      <div className="flex flex-col gap-2">
        <Label>Requisitos</Label>
        <p className="text-sm text-muted-foreground mb-1">
          O que o candidato precisa saber ou ter para se inscrever.
        </p>
        <DynamicList
          items={data.requisitos}
          inputValue={requisitoInput}
          onInputChange={setRequisitoInput}
          onAdd={() => {
            if (requisitoInput.trim()) {
              onChange("requisitos", [...data.requisitos, requisitoInput.trim()]);
              setRequisitoInput("");
            }
          }}
          onRemove={i =>
            onChange(
              "requisitos",
              data.requisitos.filter((_, idx) => idx !== i)
            )
          }
          placeholder="Ex: Conhecimento em React"
        />
      </div>

      {/* Etapas do processo */}
      <div className="flex flex-col gap-2">
        <Label>Etapas do processo</Label>
        <p className="text-sm text-muted-foreground mb-1">
          Como funciona a seleção, do início ao fim.
        </p>
        <DynamicList
          items={data.etapasProcesso}
          inputValue={etapaInput}
          onInputChange={setEtapaInput}
          onAdd={() => {
            if (etapaInput.trim()) {
              onChange("etapasProcesso", [...data.etapasProcesso, etapaInput.trim()]);
              setEtapaInput("");
            }
          }}
          onRemove={i =>
            onChange(
              "etapasProcesso",
              data.etapasProcesso.filter((_, idx) => idx !== i)
            )
          }
          placeholder="Ex: Triagem de currículos"
        />
      </div>
    </div>
  );
}
