import React from "react";
import { FolderKanban, Users, Building2 } from "lucide-react";
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

/**
 * Renders an avatar (round for usuario, rounded-md tile for entidade) sized
 * for the inline author row.
 */
function MiniAvatar({
  tipo,
  id,
  nome,
  urlFotoPerfil,
  className = "",
}: {
  tipo: "USUARIO" | "ENTIDADE";
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
  className?: string;
}) {
  if (tipo === "ENTIDADE") {
    return (
      <div
        className={`relative h-6 w-6 shrink-0 rounded-md overflow-hidden border-2 border-background bg-muted ${className}`}
      >
        {urlFotoPerfil && <Image src={urlFotoPerfil} alt={nome} fill className="object-cover" />}
      </div>
    );
  }
  return (
    <Avatar className={`h-6 w-6 shrink-0 border-2 border-background ${className}`}>
      <AvatarImage src={urlFotoPerfil || getDefaultAvatarUrl(id, nome)} alt={nome} />
      <AvatarFallback className="text-[10px]">{nome[0] ?? "U"}</AvatarFallback>
    </Avatar>
  );
}

const ProjectCard = ({ projeto }: ProjectCardProps) => {
  const { publicador, colaboradores } = projeto;
  const isEntidadePublicador = publicador.tipo === "ENTIDADE";

  // Co-autores of the same kind as the publicador, excluding the publicador itself.
  const sameKindOthers = colaboradores.filter(
    c => c.tipo === publicador.tipo && c.id !== publicador.id
  );
  const firstOther = sameKindOthers[0];
  const remainingCount = sameKindOthers.length - 1;

  // Right-side counters — total of each kind, including the publicador.
  const totalUserCount = colaboradores.filter(c => c.tipo === "USUARIO").length;
  const totalEntidadeCount = colaboradores.filter(c => c.tipo === "ENTIDADE").length;

  // Author label: "Name", "Name e Other", or "Name e outros N"
  let authorLabel = publicador.nome;
  if (sameKindOthers.length === 1 && firstOther) {
    authorLabel = `${publicador.nome} e ${firstOther.nome}`;
  } else if (sameKindOthers.length >= 2) {
    authorLabel = `${publicador.nome} e outros ${sameKindOthers.length}`;
  }

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
      <div className="mt-2 px-0.5 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Stacked avatars: publicador in front, then either the single other author or a +N badge */}
          <div className="flex items-center -space-x-3 shrink-0">
            <MiniAvatar
              tipo={publicador.tipo}
              id={publicador.id}
              nome={publicador.nome}
              urlFotoPerfil={publicador.urlFotoPerfil}
              className="relative z-10"
            />
            {sameKindOthers.length === 1 && firstOther && (
              <MiniAvatar
                tipo={firstOther.tipo}
                id={firstOther.id}
                nome={firstOther.nome}
                urlFotoPerfil={firstOther.urlFotoPerfil}
              />
            )}
            {sameKindOthers.length >= 2 && (
              <div
                className={`relative h-6 w-6 shrink-0 ${
                  isEntidadePublicador ? "rounded-md" : "rounded-full"
                } border-2 border-background bg-muted text-foreground/80 flex items-center justify-center text-[10px] font-medium`}
                title={`Mais ${remainingCount} ${isEntidadePublicador ? "entidades" : "pessoas"}`}
              >
                +{remainingCount}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate">{authorLabel}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {totalEntidadeCount > 0 && (
            <div
              className="flex items-center gap-1 text-muted-foreground"
              title={`${totalEntidadeCount} ${totalEntidadeCount === 1 ? "entidade" : "entidades"}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-xs">{totalEntidadeCount}</span>
            </div>
          )}
          {totalUserCount > 0 && (
            <div
              className="flex items-center gap-1 text-muted-foreground"
              title={`${totalUserCount} ${totalUserCount === 1 ? "pessoa" : "pessoas"}`}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">{totalUserCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
