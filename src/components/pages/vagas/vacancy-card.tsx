import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Monitor } from "lucide-react";
import { Card } from "@/components/ui/card";
import TypeBadge from "@/components/shared/badges";
import type { Vaga } from "@/lib/shared/types";

type VacancyCardProps = {
  vaga: Vaga;
};

export default function VacancyCard({ vaga }: VacancyCardProps) {
  const { titulo, tipoVaga, publicador, entidade } = vaga;

  return (
    <Card className="flex flex-row items-center p-4 w-full gap-4 border border-gray-200 rounded-lg shadow-sm cursor-pointer transition-all hover:border-gray-400 group dark:border-gray-400 dark:hover:border-gray-200">
      <div className="flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={publicador.urlFotoPerfil || getDefaultAvatarUrl(publicador.nome)} alt={publicador.nome} />
          <AvatarFallback>{publicador.nome.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold group-hover:underline">{titulo}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Publicado por: {publicador.nome}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <TypeBadge type={entidade} size="large" />

            <div className="flex items-center text-gray-500 text-sm dark:text-gray-400">
              <Monitor className="w-4 h-4 mr-1" />
              <p>{tipoVaga.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
