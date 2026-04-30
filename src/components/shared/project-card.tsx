import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Card className="w-full max-w-sm overflow-hidden hover:bg-accent/20 transition-all duration-200 border-border/90 flex flex-col h-full">
      <div className="relative h-48 w-full border-b border-border/50 shrink-0">
        {projeto.imagem ? (
          <Image src={projeto.imagem} alt={projeto.nome} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-aquario-primary/15 via-sky-100 to-aquario-primary/5 dark:from-aquario-primary/30 dark:via-slate-800 dark:to-aquario-primary/10">
            <FolderKanban className="h-12 w-12 text-aquario-primary/60 dark:text-sky-200/60" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
            {formatProjetoTipo(projeto.tipo)}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="truncate text-lg">{projeto.nome}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4">
          {projeto.subtitulo}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-2 overflow-hidden">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage
                src={
                  projeto.publicador?.urlFotoPerfil ||
                  getDefaultAvatarUrl(projeto.publicador.id, projeto.publicador.nome)
                }
                alt={projeto.publicador.nome}
              />
              <AvatarFallback>{projeto.publicador.nome[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {projeto.publicador.nome}
            </span>
          </div>
          {projeto.colaboradores.length > 0 && (
            <div
              className="flex items-center gap-1.5 text-muted-foreground"
              title={`${projeto.colaboradores.length} colaboradores`}
            >
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">{projeto.colaboradores.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
