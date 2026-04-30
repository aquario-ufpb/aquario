import React from "react";
import { Users, FolderKanban } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";

export type Publicador = {
  id: string;
  nome: string;
  slug: string;
  urlFotoPerfil?: string | null;
  tipo: "USUARIO" | "ENTIDADE";
  entidadeTipo?: "LABORATORIO" | "GRUPO" | "LIGA";
};

export type Colaborador = {
  id: string;
  tipo: "USUARIO" | "ENTIDADE";
  nome: string;
  slug: string;
  urlFotoPerfil?: string | null;
  autorPrincipal?: boolean;
};

export type TipoProjeto = "PESSOAL" | "LABORATORIO" | "GRUPO" | "LIGA";

export type Projeto = {
  id: string;
  nome: string;
  subtitulo: string;
  imagem?: string | null;
  publicador: Publicador;
  tipo: TipoProjeto;
  tags: string[];
  colaboradores: Colaborador[];
  linkRepositorio?: string;
  linkPrototipo?: string;
  linkOutro?: string;
  criadoEm: string;
};

type ProjectCardProps = {
  projeto: Projeto;
};

export const formatProjetoTipo = (tipo: TipoProjeto) => {
  switch (tipo) {
    case "PESSOAL":
      return "Pessoal";
    case "LABORATORIO":
      return "Laboratório";
    case "GRUPO":
      return "Grupo";
    case "LIGA":
      return "Liga";
    default:
      return tipo;
  }
};

const ProjectCard = ({ projeto }: ProjectCardProps) => {
  const isEntidadePublicador = projeto.publicador.tipo === "ENTIDADE";
  return (
    <div className="group flex flex-col">
      {/* The "card" — image only, Dribbble-style. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/80 bg-muted shadow-sm transition-shadow group-hover:shadow-md">
        {projeto.imagem ? (
          <Image
            src={projeto.imagem}
            alt={projeto.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-aquario-primary/15 via-sky-100 to-aquario-primary/5 dark:from-aquario-primary/30 dark:via-slate-800 dark:to-aquario-primary/10">
            <FolderKanban className="h-12 w-12 text-aquario-primary/60 dark:text-sky-200/60" />
          </div>
        )}
      </div>

      {/* Title + subtitulo below the card */}
      <div className="mt-3 px-0.5">
        <h3 className="font-semibold text-base text-foreground truncate group-hover:text-aquario-primary transition-colors">
          {projeto.nome}
        </h3>
        {projeto.subtitulo && (
          <p className="text-sm text-muted-foreground line-clamp-1">{projeto.subtitulo}</p>
        )}
      </div>

      {/* Author row outside the card */}
      <div className="mt-2 px-0.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isEntidadePublicador ? (
            <div className="relative h-5 w-5 shrink-0 rounded-md overflow-hidden border bg-muted">
              {projeto.publicador.urlFotoPerfil && (
                <Image
                  src={projeto.publicador.urlFotoPerfil}
                  alt={projeto.publicador.nome}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ) : (
            <Avatar className="h-5 w-5 shrink-0 border border-border">
              <AvatarImage
                src={
                  projeto.publicador.urlFotoPerfil ||
                  getDefaultAvatarUrl(projeto.publicador.id, projeto.publicador.nome)
                }
                alt={projeto.publicador.nome}
              />
              <AvatarFallback className="text-[10px]">
                {projeto.publicador.nome[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs text-muted-foreground truncate">{projeto.publicador.nome}</span>
        </div>
        {projeto.colaboradores.length > 0 && (
          <div
            className="flex items-center gap-1 text-muted-foreground shrink-0"
            title={`${projeto.colaboradores.length} ${
              projeto.colaboradores.length === 1 ? "colaborador" : "colaboradores"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">{projeto.colaboradores.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
