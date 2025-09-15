import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Monitor, CalendarDays } from 'lucide-react';
import { Vaga } from '@/components/Pages/Vagas/vacancyCard';

interface VagaProfileCardProps {
  vaga: Vaga;
}

export default function VagaProfileCard({ vaga }: VagaProfileCardProps) {
  const { publicador, tipoVaga, criadoEm } = vaga;

  return (
    <Card className="flex flex-col items-center gap-5 w-60">

      <CardHeader className="flex flex-col items-center pb-0">
        <CardTitle className="flex flex-col items-center gap-3">
          <Image src={publicador.urlFotoPerfil || ''} width={64} height={64} className="object-cover h-16 w-16 rounded-full" alt={`Foto de ${publicador.nome}`}/>
          <h1>{publicador.nome}</h1>
        </CardTitle>
        <CardDescription className="text-xs pb-4">Publicador</CardDescription>
      </CardHeader>

      <hr className="w-44"/>

      <CardContent className="flex flex-col items-center pb-0 text-xs">
        <div className="flex justify-between gap-1">
          <Monitor className="w-4"/>
          <p className="self-center">{tipoVaga.replace('_', ' ')}</p>
        </div>
        <div className="flex justify-between gap-1">
          <CalendarDays className="w-4"/>
          <p className="self-center">Postado em <span className="italic">{new Date(criadoEm).toLocaleDateString('pt-BR')}</span></p>
        </div>
      </CardContent>
      
      <hr className="w-44"/>

      <CardFooter className="flex justify-center">
        <a href="#" target="_blank">
          <Button className="w-28 h-8 rounded-full text-[0.75rem]">Aplicar</Button>
        </a>
      </CardFooter>
      
    </Card>
  );
}