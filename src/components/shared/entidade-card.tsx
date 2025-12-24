import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type TipoEntidade = "LABORATORIO" | "GRUPO_PESQUISA" | "LIGA_ACADEMICA" | "OUTRO";

export type Entidade = {
  id: string;
  nome: string;
  tipo: TipoEntidade;
  urlFoto?: string | null;
};

type EntidadeCardProps = {
  entidade: Entidade;
};

const EntidadeCard: React.FC<EntidadeCardProps> = ({ entidade }) => {
  const getBadgeVariant = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "default";
      case "GRUPO_PESQUISA":
        return "secondary";
      case "LIGA_ACADEMICA":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="flex flex-col items-center text-center p-6">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={entidade.urlFoto || ""} alt={entidade.nome} />
          <AvatarFallback>{entidade.nome.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-semibold truncate w-full">{entidade.nome}</CardTitle>
        <Badge variant={getBadgeVariant()} className="mt-2">
          {entidade.tipo.replace("_", " ")}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default EntidadeCard;
