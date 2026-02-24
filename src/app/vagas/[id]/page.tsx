"use client";

import { useMemo, use, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Monitor, CalendarDays, DollarSign, Clock, ExternalLink, Trash2 } from "lucide-react";
import { useVagaById, useVagas } from "@/lib/client/hooks";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useAuth } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { vagasService } from "@/lib/client/api/vagas";
import Link from "next/link";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { mapImagePath } from "@/lib/client/api/entidades";
import { ENTIDADE_VAGA_LABELS } from "@/lib/shared/types/vaga.types";
import type { Vaga } from "@/lib/shared/types";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";

function getEntidadeNome(entidade: Vaga["entidade"]): string {
  if (typeof entidade === "object") return entidade.nome;
  return ENTIDADE_VAGA_LABELS[entidade] ?? entidade;
}

function getEntidadeSlug(entidade: Vaga["entidade"]): string | null {
  if (typeof entidade === "object" && entidade.slug) return entidade.slug;
  return null;
}

function getTipoVagaLabel(tipo: string): string {
  return tipo.replace(/_/g, " ");
}

export default function VagaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: memberships = [] } = useMyMemberships();
  const queryClient = useQueryClient();

  const { data: vaga, isLoading, error: queryError } = useVagaById(id);
  const { data: allVagas = [] } = useVagas();

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const otherVagas = useMemo(() => {
    if (!vaga) return [];
    return allVagas.filter(v => v.tipoVaga === vaga.tipoVaga && v.id !== vaga.id).slice(0, 8);
  }, [vaga, allVagas]);

  const entidadeId = vaga && typeof vaga.entidade === "object" ? vaga.entidade.id : null;
  const isMasterAdmin = user?.papelPlataforma === "MASTER_ADMIN";
  const isAdminOfEntidade =
    !!entidadeId && memberships.some(m => m.papel === "ADMIN" && !m.endedAt && m.entidade.id === entidadeId);
  const canDelete = !!(user && (isMasterAdmin || isAdminOfEntidade));

  const handleDelete = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await vagasService.delete(id, token);
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      router.push("/vagas");
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (queryError || !vaga) {
    const errorMessage = queryError instanceof Error ? queryError.message : "Vaga não encontrada.";
    return (
      <div className="container mx-auto p-4 pt-24 text-center text-red-500">{errorMessage}</div>
    );
  }

  const entidadeNome = getEntidadeNome(vaga.entidade);
  const entidadeSlug = getEntidadeSlug(vaga.entidade);
  const entidadeAvatarSrc =
    typeof vaga.entidade === "object"
      ? mapImagePath("urlFoto" in vaga.entidade ? vaga.entidade.urlFoto : undefined)
      : getDefaultAvatarUrl(entidadeNome, entidadeNome);
  const tipoVagaLabel = getTipoVagaLabel(vaga.tipoVaga);
  const applyLink = vaga.linkInscricao ?? vaga.linkVaga;

  return (
    <div className="mt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Back button + actions */}
        <div className="px-6 md:px-8 lg:px-16 pt-8 pb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          {canDelete && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Excluir vaga
              </Button>
              <ConfirmDeleteDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Excluir vaga"
                description="Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita."
                onConfirm={handleDelete}
                isPending={isDeleting}
              />
            </>
          )}
        </div>

        {/* Hero section */}
        <div className="px-6 md:px-8 lg:px-16 pt-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-8 lg:gap-12">
            {/* Avatar */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border border-border/30 shadow-sm flex items-center justify-center bg-muted">
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage
                    src={entidadeAvatarSrc}
                    alt={entidadeNome}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-none text-2xl font-semibold">
                    {entidadeNome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Main info */}
            <div className="flex flex-col gap-5">
              <div>
                {/* Entity name */}
                {entidadeSlug ? (
                  <Link
                    href={`/entidade/${entidadeSlug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors mb-1 inline-block"
                  >
                    {entidadeNome}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground mb-1">{entidadeNome}</p>
                )}

                <h1 className="text-2xl md:text-3xl font-bold mb-3">{vaga.titulo}</h1>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
                  >
                    <Monitor className="w-3 h-3 mr-1" />
                    {tipoVagaLabel}
                  </Badge>
                  {vaga.areas?.map(area => (
                    <Badge
                      key={area}
                      variant="outline"
                      className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 font-normal"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    Publicado em{" "}
                    <span className="text-foreground">
                      {new Date(vaga.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                </div>

                {vaga.dataFinalizacao && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Encerra em{" "}
                      <span className="text-foreground">
                        {new Date(vaga.dataFinalizacao).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    </span>
                  </div>
                )}

                {vaga.prazo && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Prazo: <span className="text-foreground">{vaga.prazo}</span>
                    </span>
                  </div>
                )}

                {vaga.salario && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-foreground">{vaga.salario}</span>
                  </div>
                )}
              </div>

              {/* Apply button + publicador */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {applyLink && (
                  <Button asChild className="w-fit rounded-full">
                    <a href={applyLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Aplicar
                    </a>
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  Publicado por{" "}
                  <span className="text-foreground">{vaga.publicador.nome}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sobre a empresa */}
        {vaga.sobreEmpresa && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Sobre a empresa</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {vaga.sobreEmpresa}
              </p>
            </div>
          </div>
        )}

        {/* Descrição */}
        {vaga.descricao && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Descrição da vaga</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {vaga.descricao}
              </p>
            </div>
          </div>
        )}

        {/* Responsabilidades */}
        {vaga.responsabilidades?.length > 0 && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Responsabilidades</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
                {vaga.responsabilidades.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Requisitos */}
        {vaga.requisitos?.length > 0 && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Requisitos</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
                {vaga.requisitos.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Etapas do processo */}
        {vaga.etapasProcesso?.length > 0 && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Etapas do processo</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1.5 leading-relaxed">
                {vaga.etapasProcesso.map((etapa, idx) => (
                  <li key={idx}>{etapa}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        {vaga.informacoesAdicionais && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-4">Informações adicionais</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {vaga.informacoesAdicionais}
              </p>
            </div>
          </div>
        )}

        {/* Other vagas */}
        {otherVagas.length > 0 && (
          <div className="px-6 md:px-8 lg:px-16 pb-12">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-lg font-semibold mb-6">
                Outras vagas de {tipoVagaLabel.toLowerCase()}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherVagas.map(v => {
                  const nome = getEntidadeNome(v.entidade);
                  const otherAvatarSrc =
                    typeof v.entidade === "object"
                      ? mapImagePath("urlFoto" in v.entidade ? v.entidade.urlFoto : undefined)
                      : getDefaultAvatarUrl(nome, nome);
                  return (
                    <Link key={v.id} href={`/vagas/${v.id}`} className="group">
                      <div className="flex gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-all duration-200 h-full">
                        <div className="flex-shrink-0 flex items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={otherAvatarSrc}
                              alt={nome}
                            />
                            <AvatarFallback>{nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">
                              {v.titulo}
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30 flex-shrink-0 font-normal"
                            >
                              {getTipoVagaLabel(v.tipoVaga)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{nome}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
