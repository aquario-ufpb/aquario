"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type Autor = {
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
};

export type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  urlFoto?: string | null;
  autor: Autor;
  tipo: string;
  tags: string[];
  membros?: { id: string }[];
};

type ProjectCardProps = {
  projeto: Projeto;
};

const stripHtml = (html: string) => {
  if (typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  return html;
};

const ProjectCard = ({ projeto }: ProjectCardProps) => {
  return (
    <Card className="w-full max-w-sm overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={projeto.urlFoto || "/lab.jpg"}
          alt={projeto.titulo}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardHeader>
        <CardTitle className="truncate">{projeto.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {stripHtml(projeto.descricao)}
        </p>
        {projeto.autor && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-4 pt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{projeto.autor.nome[0]}</AvatarFallback>
            </Avatar>
            <span>{projeto.autor.nome}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
