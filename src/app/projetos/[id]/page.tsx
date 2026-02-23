"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Projeto, formatProjetoTipo } from "@/components/shared/project-card";
import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import DOMPurify from "dompurify";
import Link from "next/link";

export default function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProjeto = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/projetos/${id}`);

        if (!response.ok) {
          throw new Error("Projeto não encontrado");
        }

        const data = await response.json();

        let publicador: Projeto["publicador"];

        if (data.entidade) {
          publicador = {
            id: data.entidade.id,
            nome: data.entidade.nome,
            slug: data.entidade.slug,
            urlFotoPerfil: data.entidade.urlFoto ?? null,
            tipo: "ENTIDADE" as const,
            entidadeTipo: data.entidade.tipo,
          };
        } else {
          const autorPrincipalObj = data.autores.find((a: any) => a.autorPrincipal);

          const autorPrincipal = autorPrincipalObj?.usuario;

          publicador = {
            id: autorPrincipal?.id ?? "0",
            nome: autorPrincipal?.nome ?? "Usuário",
            slug: autorPrincipal?.slug ?? autorPrincipal?.nome,
            urlFotoPerfil: autorPrincipal?.urlFotoPerfil ?? null,
            tipo: "USUARIO" as const,
          };
        }

        const colaboradores = data.autores.map((a: any) => ({
          id: a.usuario.id,
          nome: a.usuario.nome,
          urlFotoPerfil: a.usuario.urlFotoPerfil,
          autorPrincipal: a.autorPrincipal,
        }));

        const projetoMapeado: Projeto = {
          id: data.slug,
          nome: data.titulo,
          descricao: data.descricao ?? "",
          imagem: data.urlImagem ?? null,
          tipo: data.entidade?.tipo ?? "PESSOAL",
          tags: data.tags ?? [],
          criadoEm: data.criadoEm,

          publicador,

          colaboradores,
          linkRepositorio: data.urlRepositorio ?? undefined,
          linkPrototipo: data.urlDemo ?? undefined,
        };

        setProjeto(projetoMapeado);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erro ao carregar projeto");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjeto();
    }
  }, [id]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error || !projeto) {
    return (
      <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl text-center text-red-500">
        {error || "Projeto não encontrado."}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
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
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                variant="outline"
                className="text-sm border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                {formatProjetoTipo(projeto.tipo)}
              </Badge>
              {projeto.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-4 pt-2">
              {projeto.linkRepositorio && (
                <Button variant="outline" size="sm" asChild>
                  <a href={projeto.linkRepositorio} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    Repositório
                  </a>
                </Button>
              )}
              {projeto.linkPrototipo && (
                <Button variant="outline" size="sm" asChild>
                  <a href={projeto.linkPrototipo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Protótipo
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="relative h-[20rem] md:h-[24rem] w-full overflow-hidden rounded-xl border border-border/50 shadow-sm">
            <Image
              src={projeto.imagem || "/lab.jpg"}
              alt={projeto.nome}
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-2xl font-semibold mb-4">Sobre o Projeto</h3>
            <div
              className="text-lg text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(projeto.descricao) }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/90 shadow-sm">
            <CardHeader>
              <CardTitle>Publicado por</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={
                  projeto.publicador.entidadeTipo
                    ? `/entidade/${projeto.publicador.slug}`
                    : `/usuarios/${projeto.publicador.slug}`
                }
                className="flex-1 min-w-0"
              >
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
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/90 shadow-sm">
            <CardHeader>
              <CardTitle>Colaboradores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.colaboradores.length > 0 ? (
                projeto.colaboradores.map(colaborador => (
                  <Link
                    key={colaborador.id}
                    href={`/usuarios/${colaborador.nome}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={colaborador.urlFotoPerfil || ""} alt={colaborador.nome} />
                        <AvatarFallback>{colaborador.nome?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{colaborador.nome}</span>

                        {colaborador.autorPrincipal && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-primary text-primary"
                          >
                            Autor Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum colaborador registrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
