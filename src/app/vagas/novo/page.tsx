"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useEntidades } from "@/lib/client/hooks/use-entidades";
import { vagasService } from "@/lib/client/api/vagas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronDown, Check, X, Plus } from "lucide-react";
import { TipoVaga } from "@/lib/shared/types";
import { cn } from "@/lib/client/utils";

type EntidadeOption = { id: string; nome: string };

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

type DynamicListProps = {
  items: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
};

function DynamicList({
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: DynamicListProps) {
  return (
    <div className="flex flex-col gap-2 max-w-2xl">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) {
                onAdd();
              }
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="flex-shrink-0 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-input bg-muted/40 text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground/60 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NovaVagaPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: memberships = [], isLoading: isMembershipsLoading } = useMyMemberships();
  const { data: allEntidades = [], isLoading: isEntidadesLoading } = useEntidades();
  const router = useRouter();

  // Required fields
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoVaga, setTipoVaga] = useState<TipoVaga | "">("");
  const [entidadeId, setEntidadeId] = useState("");
  const [entidadeOpen, setEntidadeOpen] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [linkInscricao, setLinkInscricao] = useState("");
  const [dataFinalizacao, setDataFinalizacao] = useState("");

  // Optional fields
  const [salario, setSalario] = useState("");
  const [sobreEmpresa, setSobreEmpresa] = useState("");
  const [responsabilidades, setResponsabilidades] = useState<string[]>([]);
  const [responsabilidadeInput, setResponsabilidadeInput] = useState("");
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [requisitoInput, setRequisitoInput] = useState("");
  const [etapasProcesso, setEtapasProcesso] = useState<string[]>([]);
  const [etapaInput, setEtapaInput] = useState("");
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMasterAdmin = user?.papelPlataforma === "MASTER_ADMIN";
  const adminEntidades = useMemo(() => {
    return memberships
      .filter(m => m.papel === "ADMIN" && !m.endedAt)
      .map(m => ({ id: m.entidade.id, nome: m.entidade.nome }));
  }, [memberships]);

  const entidadeOptions: EntidadeOption[] = isMasterAdmin
    ? allEntidades.map(e => ({ id: e.id, nome: e.name }))
    : adminEntidades;

  const selectedEntidade = entidadeOptions.find(e => e.id === entidadeId);

  const canPostJob = isMasterAdmin || adminEntidades.length > 0;
  const isDataLoading =
    isAuthLoading || isUserLoading || isMembershipsLoading || (isMasterAdmin && isEntidadesLoading);

  useEffect(() => {
    if (!isDataLoading && !canPostJob) {
      router.push("/vagas");
    }
  }, [isDataLoading, canPostJob, router]);

  useEffect(() => {
    if (entidadeOptions.length === 1 && !entidadeId) {
      setEntidadeId(entidadeOptions[0].id);
    }
  }, [entidadeOptions, entidadeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !tipoVaga ||
      !entidadeId ||
      !linkInscricao.trim() ||
      !dataFinalizacao
    ) {
      setError("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const hoje = new Date().toISOString().slice(0, 10);
    if (dataFinalizacao < hoje) {
      setError("A data de finalização deve ser futura.");
      return;
    }

    const dataFim = new Date(dataFinalizacao);

    setIsSubmitting(true);
    setError(null);

    try {
      await vagasService.create(
        {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          tipoVaga,
          entidadeId,
          areas,
          linkInscricao: linkInscricao.trim(),
          dataFinalizacao: dataFim.toISOString(),
          salario: salario.trim() || null,
          sobreEmpresa: sobreEmpresa.trim() || null,
          responsabilidades,
          requisitos,
          etapasProcesso,
          informacoesAdicionais: informacoesAdicionais.trim() || null,
        },
        token
      );
      router.push("/vagas");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro ao publicar a vaga.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading || !canPostJob) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <div className="mt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Back button */}
        <div className="px-6 md:px-8 lg:px-16 pt-8 pb-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Title */}
        <div className="px-6 md:px-8 lg:px-16 pt-4 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Divulgar Nova Vaga</h1>
          <p className="text-muted-foreground mt-2">
            Preencha as informações abaixo para publicar uma oportunidade no mural.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section: Entidade */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">Entidade</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione a entidade em nome da qual a vaga será publicada.
              </p>
              <div className="max-w-md">
                <Popover open={entidadeOpen} onOpenChange={setEntidadeOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0",
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
                                setEntidadeId("");
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
                                setEntidadeId(ent.id);
                                setEntidadeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 mr-2 flex-shrink-0",
                                  entidadeId === ent.id ? "opacity-100" : "opacity-0"
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
          </div>

          {/* Section: Informações da vaga */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">Informações da vaga</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Dados principais que aparecerão no mural e na página da vaga.
              </p>

              <div className="flex flex-col gap-5 max-w-2xl">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="titulo">Título da vaga</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ex: Desenvolvedor Frontend Jr."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tipoVaga">Tipo de vaga</Label>
                    <Select
                      onValueChange={(value: TipoVaga) => setTipoVaga(value)}
                      value={tipoVaga}
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

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dataFinalizacao">Encerra em</Label>
                    <Input
                      id="dataFinalizacao"
                      type="date"
                      value={dataFinalizacao}
                      onChange={e => setDataFinalizacao(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Após esta data a vaga sai do mural.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="linkInscricao">Link para inscrição</Label>
                    <Input
                      id="linkInscricao"
                      type="url"
                      value={linkInscricao}
                      onChange={e => setLinkInscricao(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="salario">
                      Remuneração{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="salario"
                      value={salario}
                      onChange={e => setSalario(e.target.value)}
                      placeholder="Ex: R$ 1.500 / Bolsa"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>
                    Áreas <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione as áreas relacionadas à vaga para que ela apareça nos filtros.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AREA_OPTIONS.map(area => {
                      const selected = areas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() =>
                            setAreas(prev =>
                              selected ? prev.filter(a => a !== area) : [...prev, area]
                            )
                          }
                          className={cn(
                            "px-3 py-1 rounded-full text-sm border transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
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
            </div>
          </div>

          {/* Section: Descrição */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">Descrição</h2>
              <p className="text-sm text-muted-foreground mb-6">
                O que a pessoa vai fazer, o que precisa saber e por que essa vaga vale a pena.
              </p>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Escreva aqui! Seja direto, mas não chato. Boas vagas têm boas descrições."
                rows={8}
                className="max-w-2xl"
              />
            </div>
          </div>

          {/* Section: Sobre a empresa */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">
                Sobre a empresa{" "}
                <span className="text-muted-foreground text-base font-normal">(opcional)</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Contexto sobre a organização que está abrindo a vaga.
              </p>
              <Textarea
                value={sobreEmpresa}
                onChange={e => setSobreEmpresa(e.target.value)}
                placeholder="Quem somos, o que fazemos, qual o nosso propósito..."
                rows={4}
                className="max-w-2xl"
              />
            </div>
          </div>

          {/* Section: Processo seletivo */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">
                Processo seletivo{" "}
                <span className="text-muted-foreground text-base font-normal">(opcional)</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Detalhe o que se espera do candidato e como será o processo.
              </p>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <Label>Responsabilidades</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    O que a pessoa vai fazer no dia a dia.
                  </p>
                  <DynamicList
                    items={responsabilidades}
                    inputValue={responsabilidadeInput}
                    onInputChange={setResponsabilidadeInput}
                    onAdd={() => {
                      if (responsabilidadeInput.trim()) {
                        setResponsabilidades(prev => [...prev, responsabilidadeInput.trim()]);
                        setResponsabilidadeInput("");
                      }
                    }}
                    onRemove={i => setResponsabilidades(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Ex: Desenvolver e manter features do produto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Requisitos</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    O que o candidato precisa saber ou ter para se inscrever.
                  </p>
                  <DynamicList
                    items={requisitos}
                    inputValue={requisitoInput}
                    onInputChange={setRequisitoInput}
                    onAdd={() => {
                      if (requisitoInput.trim()) {
                        setRequisitos(prev => [...prev, requisitoInput.trim()]);
                        setRequisitoInput("");
                      }
                    }}
                    onRemove={i => setRequisitos(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Ex: Conhecimento em React"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Etapas do processo</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Como funciona a seleção, do início ao fim.
                  </p>
                  <DynamicList
                    items={etapasProcesso}
                    inputValue={etapaInput}
                    onInputChange={setEtapaInput}
                    onAdd={() => {
                      if (etapaInput.trim()) {
                        setEtapasProcesso(prev => [...prev, etapaInput.trim()]);
                        setEtapaInput("");
                      }
                    }}
                    onRemove={i => setEtapasProcesso(prev => prev.filter((_, idx) => idx !== i))}
                    placeholder="Ex: Triagem de currículos"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Informações adicionais */}
          <div className="px-6 md:px-8 lg:px-16 pb-10">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-1">
                Informações adicionais{" "}
                <span className="text-muted-foreground text-base font-normal">(opcional)</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Benefícios, diferenciais, observações ou qualquer outro detalhe relevante.
              </p>
              <Textarea
                value={informacoesAdicionais}
                onChange={e => setInformacoesAdicionais(e.target.value)}
                placeholder="Vale transporte, horário flexível, trabalho remoto..."
                rows={4}
                className="max-w-2xl"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 md:px-8 lg:px-16 pb-16">
            <div className="border-t border-border/30 pt-8 flex flex-col gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center gap-3">
                <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? "Publicando..." : "Publicar vaga"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
