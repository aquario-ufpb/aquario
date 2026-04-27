import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Check, X } from "lucide-react";
import { TipoVaga } from "@/lib/shared/types";
import { cn } from "@/lib/client/utils";
import type { VagaFormData, VagaFormUpdater, EntidadeOption } from "./types";

const AREA_OPTIONS = [
  "FrontEnd",
  "BackEnd",
  "Dados",
  "Infraestrutura",
  "Design",
  "Pesquisa",
  "Robótica",
  "Otimização e Algoritmos",
];

type StepInformacoesProps = {
  data: VagaFormData;
  onChange: VagaFormUpdater;
  entidadeOptions: EntidadeOption[];
};

export function StepInformacoes({ data, onChange, entidadeOptions }: StepInformacoesProps) {
  const [entidadeOpen, setEntidadeOpen] = useState(false);
  const selectedEntidade = entidadeOptions.find(e => e.id === data.entidadeId);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Entidade */}
      <div className="flex flex-col gap-1.5">
        <Label>Entidade</Label>
        <p className="text-sm text-muted-foreground">
          Selecione a entidade em nome da qual a vaga será publicada.
        </p>
        <div>
          <Popover open={entidadeOpen} onOpenChange={setEntidadeOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  !selectedEntidade && "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {selectedEntidade ? selectedEntidade.nome : "Selecione a entidade"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0"
              style={{ width: "var(--radix-popover-trigger-width)" }}
              align="start"
            >
              <Command>
                <CommandInput placeholder="Buscar entidade..." />
                <CommandList>
                  <CommandEmpty>Nenhuma entidade encontrada.</CommandEmpty>
                  <CommandGroup>
                    {selectedEntidade && (
                      <CommandItem
                        value="__clear__"
                        onSelect={() => {
                          onChange("entidadeId", "");
                          setEntidadeOpen(false);
                        }}
                        className="text-muted-foreground"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar seleção
                      </CommandItem>
                    )}
                    {entidadeOptions.map(ent => (
                      <CommandItem
                        key={ent.id}
                        value={ent.nome}
                        onSelect={() => {
                          onChange("entidadeId", ent.id);
                          setEntidadeOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 mr-2 flex-shrink-0",
                            data.entidadeId === ent.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {ent.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Título + Tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titulo">Título da vaga</Label>
          <Input
            id="titulo"
            value={data.titulo}
            onChange={e => onChange("titulo", e.target.value)}
            placeholder="Ex: Desenvolvedor Frontend Jr."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipoVaga">Tipo de vaga</Label>
          <Select
            onValueChange={(value: TipoVaga) => onChange("tipoVaga", value)}
            value={data.tipoVaga}
          >
            <SelectTrigger id="tipoVaga">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TipoVaga).map(tipo => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Encerra em + Remuneração */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dataFinalizacao">Encerra em</Label>
          <Input
            id="dataFinalizacao"
            type="date"
            min={today}
            value={data.dataFinalizacao}
            onChange={e => onChange("dataFinalizacao", e.target.value)}
            className={cn("cursor-pointer w-fit", !data.dataFinalizacao && "text-muted-foreground")}
          />
          <p className="text-sm text-muted-foreground">Após esta data a vaga sai do mural.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="salario">
            Remuneração <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="salario"
            value={data.salario}
            onChange={e => onChange("salario", e.target.value)}
            placeholder="Ex: R$ 1.500 / Bolsa"
          />
        </div>
      </div>

      {/* Link para inscrição */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="linkInscricao">Link para inscrição</Label>
        <Input
          id="linkInscricao"
          type="url"
          value={data.linkInscricao}
          onChange={e => onChange("linkInscricao", e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Áreas */}
      <div className="flex flex-col gap-1.5">
        <Label>
          Áreas <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Selecione as áreas relacionadas à vaga para que ela apareça nos filtros.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {AREA_OPTIONS.map(area => {
            const selected = data.areas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() =>
                  onChange(
                    "areas",
                    selected ? data.areas.filter(a => a !== area) : [...data.areas, area]
                  )
                }
                className={cn(
                  "px-3 py-1 rounded-full text-sm border transition-colors",
                  selected
                    ? "bg-aquario-primary text-white border-aquario-primary"
                    : "bg-background text-muted-foreground border-input hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
