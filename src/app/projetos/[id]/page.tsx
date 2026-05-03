"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { useProjetoBySlug } from "@/lib/client/hooks/use-projetos";
import { useUpdateProjeto } from "@/lib/client/hooks/use-criar-projeto";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { canEditProjeto } from "@/lib/client/utils/projeto-permissions";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  FolderKanban,
  Pencil,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { SimilarProjetosSection } from "@/components/pages/projetos/similar-projetos-section";
import { trackEvent } from "@/analytics/posthog-client";
import type { ProjetoStatus } from "@/analytics/posthog-events";

/** "jan/2025" — empty string if no date. */
function formatMonthYear(d: Date | string | null | undefined): string {
  return d ? format(new Date(d), "MMM/yyyy", { locale: ptBR }).replace(".", "") : "";
}

export default function ProjetoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: raw, isLoading, error } = useProjetoBySlug(id);
  const { data: usuario } = useCurrentUser();
  const { data: memberships = [] } = useMyMemberships();
  const updateProjeto = useUpdateProjeto(id);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const projeto = useMemo(() => (raw ? mapProjetoToCard(raw) : null), [raw]);

  // Display order: entidades first, then users; principal first within each group.
  const orderedColaboradores = useMemo(() => {
    if (!projeto) {
      return [];
    }
    return [...projeto.colaboradores].sort((a, b) => {
      if (a.tipo !== b.tipo) {
        return a.tipo === "ENTIDADE" ? -1 : 1;
      }
      if (a.autorPrincipal !== b.autorPrincipal) {
        return a.autorPrincipal ? -1 : 1;
      }
      return 0;
    });
  }, [projeto]);

  const myAdminEntidadeIds = useMemo(
    () =>
      new Set(memberships.filter(m => m.papel === "ADMIN" && !m.endedAt).map(m => m.entidade.id)),
    [memberships]
  );

  const canEdit = useMemo(
    () =>
      canEditProjeto(
        usuario,
        raw?.autores.map(a => ({
          usuarioId: a.usuarioId,
          entidadeId: a.entidadeId,
          autorPrincipal: a.autorPrincipal,
        })) ?? [],
        myAdminEntidadeIds
      ),
    [usuario, raw, myAdminEntidadeIds]
  );

  const isArchived = raw?.status === "ARQUIVADO";

  // Fire once per loaded projeto. Depending on `raw.id` (not `raw`) avoids
  // duplicate fires from React Query refetches/mutations: structural sharing
  // can't help when the mutation changes a field (e.g. archive/unarchive flips
  // status), so the object reference would change but the id stays put.
  useEffect(() => {
    if (!raw) {
      return;
    }
    trackEvent("projeto_viewed", {
      projeto_slug: id,
      status: raw.status as ProjetoStatus,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, raw?.id]);

  const handleArchiveToggle = async () => {
    if (!raw) {
      return;
    }
    const nextStatus = isArchived ? "PUBLICADO" : "ARQUIVADO";
    const verb = isArchived ? "Desarquivando" : "Arquivando";
    const verbDone = isArchived ? "desarquivado" : "arquivado";
    const toastId = toast.loading(`${verb} projeto...`);
    try {
      await updateProjeto.mutateAsync({ status: nextStatus });
      trackEvent(isArchived ? "projeto_unarchived" : "projeto_archived", {
        projeto_slug: id,
      });
      toast.success(`Projeto ${verbDone}.`, { id: toastId });
      setArchiveOpen(false);
      if (!isArchived) {
        // After archiving, send the user back to the list — the project won't
        // appear in the public Publicados view anymore.
        router.push("/projetos");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar status do projeto.", {
        id: toastId,
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error || !projeto) {
    return (
      <div className="container mx-auto p-4 md:p-8 mt-8 max-w-7xl text-center text-red-500">
        {error instanceof Error ? error.message : "Projeto não encontrado."}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 mt-8 max-w-7xl pb-32">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => {
            const sameOriginReferrer =
              typeof document !== "undefined" &&
              document.referrer &&
              new URL(document.referrer).origin === window.location.origin;
            if (sameOriginReferrer && window.history.length > 1) {
              router.back();
            } else {
              router.push("/projetos");
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projetos/${id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
              {isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Desarquivar
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              {projeto.nome}
            </h1>
            {projeto.subtitulo && (
              <p className="text-lg text-muted-foreground leading-relaxed">{projeto.subtitulo}</p>
            )}
          </div>

          <div className="relative h-[20rem] md:h-[24rem] w-full overflow-hidden rounded-xl border border-border/50 shadow-sm">
            {projeto.imagem ? (
              <Image
                src={projeto.imagem}
                alt={projeto.nome}
                fill
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-aquario-primary/15 via-sky-100 to-aquario-primary/5 dark:from-aquario-primary/30 dark:via-slate-800 dark:to-aquario-primary/10">
                <FolderKanban className="h-20 w-20 text-aquario-primary/60 dark:text-sky-200/60" />
              </div>
            )}
          </div>

          {raw?.textContent && (
            <div className="prose dark:prose-invert max-w-none text-base leading-relaxed">
              {/* react-markdown renders React nodes — never raw HTML — so any
                  embedded <script> or javascript: link is structurally safe.
                  remark-gfm adds tables, strikethrough, autolink, task lists. */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{raw.textContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-10">
          {/* Publicado por */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Publicado por
            </h3>
            {(() => {
              const publicadorContent = (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        projeto.publicador.urlFotoPerfil ||
                        getDefaultAvatarUrl(projeto.publicador.id, projeto.publicador.nome)
                      }
                      alt={projeto.publicador.nome}
                    />
                    <AvatarFallback>{projeto.publicador?.nome[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{projeto.publicador.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      Em {new Date(projeto.criadoEm).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );

              const slug = projeto.publicador.slug;
              if (slug) {
                const href = projeto.publicador.entidadeTipo
                  ? `/entidade/${slug}`
                  : `/usuarios/${slug}`;
                return (
                  <Link
                    href={href}
                    className="block -ml-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    {publicadorContent}
                  </Link>
                );
              }

              return <div className="-ml-2 p-2">{publicadorContent}</div>;
            })()}
          </section>

          {/* Colaboradores */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Colaboradores
            </h3>
            {orderedColaboradores.length > 0 ? (
              <div className="space-y-1">
                {orderedColaboradores.map(colaborador => {
                  const isEntidade = colaborador.tipo === "ENTIDADE";
                  // Slugs are nullable on both Usuario and Entidade — render
                  // a non-clickable row when missing instead of routing to
                  // /usuarios/null. The body is identical either way.
                  const href = colaborador.slug
                    ? isEntidade
                      ? `/entidade/${colaborador.slug}`
                      : `/usuarios/${colaborador.slug}`
                    : null;
                  const Wrapper = (props: { children: React.ReactNode }) =>
                    href ? (
                      <Link
                        href={href}
                        className="flex items-center gap-3 -ml-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                      >
                        {props.children}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 -ml-2 rounded-lg p-2 transition-colors">
                        {props.children}
                      </div>
                    );
                  return (
                    <Wrapper key={`${colaborador.tipo}-${colaborador.id}`}>
                      {isEntidade ? (
                        <div className="relative h-8 w-8 rounded-md overflow-hidden border bg-muted shrink-0">
                          {colaborador.urlFotoPerfil && (
                            <Image
                              src={colaborador.urlFotoPerfil}
                              alt={colaborador.nome}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              colaborador.urlFotoPerfil ||
                              getDefaultAvatarUrl(colaborador.id, colaborador.nome)
                            }
                            alt={colaborador.nome}
                          />
                          <AvatarFallback>{colaborador.nome?.[0] ?? "U"}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{colaborador.nome}</span>
                        {colaborador.autorPrincipal && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-primary text-primary shrink-0"
                          >
                            Autor Principal
                          </Badge>
                        )}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum colaborador registrado.</p>
            )}
          </section>

          {/* Período */}
          {(raw?.dataInicio || raw?.dataFim) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Período
              </h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Início</dt>
                <dd className="text-foreground capitalize">
                  {formatMonthYear(raw.dataInicio) || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
                <dt className="text-muted-foreground">Fim</dt>
                <dd className="capitalize">
                  {formatMonthYear(raw.dataFim) || (
                    <span className="text-muted-foreground italic">em andamento</span>
                  )}
                </dd>
              </dl>
            </section>
          )}

          {/* Tags */}
          {projeto.tags.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {projeto.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Links */}
          {(projeto.linkRepositorio || projeto.linkPrototipo || projeto.linkOutro) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Links
              </h3>
              <div className="flex flex-col">
                {projeto.linkRepositorio && (
                  <a
                    href={projeto.linkRepositorio}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent("projeto_link_clicked", {
                        projeto_slug: id,
                        link_type: "repositorio",
                      })
                    }
                    className="flex items-center gap-3 -ml-2 rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-aquario-primary"
                  >
                    <Github className="h-4 w-4 text-muted-foreground" />
                    Repositório
                  </a>
                )}
                {projeto.linkPrototipo && (
                  <a
                    href={projeto.linkPrototipo}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent("projeto_link_clicked", {
                        projeto_slug: id,
                        link_type: "prototipo",
                      })
                    }
                    className="flex items-center gap-3 -ml-2 rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-aquario-primary"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    Demo
                  </a>
                )}
                {projeto.linkOutro && (
                  <a
                    href={projeto.linkOutro}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent("projeto_link_clicked", {
                        projeto_slug: id,
                        link_type: "outro",
                      })
                    }
                    className="flex items-center gap-3 -ml-2 rounded-lg p-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-aquario-primary"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    Saiba mais
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      {raw?.status === "PUBLICADO" && <SimilarProjetosSection slug={id} />}

      <ConfirmDeleteDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? "Desarquivar projeto?" : "Arquivar projeto?"}
        description={
          isArchived
            ? "O projeto voltará a aparecer publicamente em /projetos."
            : "O projeto deixará de aparecer no mural público. Você pode desarquivar a qualquer momento."
        }
        confirmLabel={isArchived ? "Desarquivar" : "Arquivar"}
        pendingLabel={isArchived ? "Desarquivando..." : "Arquivando..."}
        variant="default"
        onConfirm={handleArchiveToggle}
        isPending={updateProjeto.isPending}
      />
    </div>
  );
}
