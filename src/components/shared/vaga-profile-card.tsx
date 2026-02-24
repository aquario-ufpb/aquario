import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Monitor, CalendarDays } from "lucide-react";
import type { Vaga } from "@/lib/shared/types";

type VagaProfileCardProps = {
  vaga: Vaga;
};

export default function VagaProfileCard({ vaga }: VagaProfileCardProps) {
  const { publicador, tipoVaga, criadoEm } = vaga;

  return (
    <Card className="flex flex-col items-center gap-5 w-60">
      <CardHeader className="flex flex-col items-center pb-0">
        <CardTitle className="flex flex-col items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={
                vaga.publicador.urlFotoPerfil ||
                getDefaultAvatarUrl(vaga.publicador.nome, vaga.publicador.nome)
              }
              alt={vaga.publicador.nome}
            />
            <AvatarFallback>{vaga.publicador.nome.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1>{publicador.nome}</h1>
        </CardTitle>
        <CardDescription className="text-xs pb-4">Publicador</CardDescription>
      </CardHeader>

      <hr className="w-44" />

      <CardContent className="flex flex-col items-center pb-0 text-xs">
        <div className="flex justify-between gap-1">
          <Monitor className="w-4" />
          <p className="self-center">{tipoVaga.replace("_", " ")}</p>
        </div>
        <div className="flex justify-between gap-1">
          <CalendarDays className="w-4" />
          <p className="self-center">
            Postado em{" "}
            <span className="italic">{new Date(criadoEm).toLocaleDateString("pt-BR")}</span>
          </p>
        </div>
      </CardContent>

      <hr className="w-44" />

      <CardFooter className="flex justify-center">
        <Button asChild className="w-28 h-8 rounded-full text-[0.75rem]">
          <a
            href={vaga.linkInscricao ?? vaga.linkVaga ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aplicar
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
