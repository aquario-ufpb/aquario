"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { useProjetoBySlug } from "@/lib/client/hooks/use-projetos";
import { ArrowLeft, Github, ExternalLink, FolderKanban } from "lucide-react";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import DOMPurify from "dompurify";
import Link from "next/link";

export default function ProjetoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: raw, isLoading, error } = useProjetoBySlug(id);

  const projeto = useMemo(() => (raw ? mapProjetoToCard(raw) : null), [raw]);

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
    <div className="container mx-auto p-4 md:p-8 mt-8 max-w-7xl">
      <Button
        variant="ghost"
        className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

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
            <div
              className="prose dark:prose-invert max-w-none text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw.textContent) }}
            />
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
            {projeto.colaboradores.length > 0 ? (
              <div className="space-y-1">
                {projeto.colaboradores.map(colaborador => (
                  <Link
                    key={colaborador.id}
                    href={`/usuarios/${colaborador.slug}`}
                    className="flex items-center gap-3 -ml-2 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
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
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum colaborador registrado.</p>
            )}
          </section>

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
    </div>
  );
}
