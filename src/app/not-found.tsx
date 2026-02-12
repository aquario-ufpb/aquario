import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 dark:bg-[#020202]">
      {/* Dark theme layout - centered, stacked */}
      <div className="hidden dark:flex flex-col items-center text-center max-w-lg gap-6">
        <Image
          src="/404/dark.png"
          alt="Peixe-lanterna nas profundezas do oceano"
          width={400}
          height={300}
          className="w-full max-w-sm"
          priority
        />

        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{
            color: "#E1FBFB",
            textShadow:
              "0 0 7px #50A8B3, 0 0 10px #50A8B3, 0 0 21px #50A8B3, 0 0 42px #50A8B3, 0 0 82px #50A8B3",
          }}
        >
          404: A pressão está aumentando
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Você chegou à Zona Abissal. Está escuro, está vazio e esse
          peixe-lanterna está começando a nos encarar de um jeito estranho.
          Vamos voltar para a superfície?
        </p>

        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>

      {/* Light theme layout - side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-4xl dark:hidden">
        <div className="flex flex-col gap-4 md:col-start-1 md:row-start-1 md:row-span-3">
          <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
            <span className="font-bold">404</span>: Essa página se juntou ao
            cardume
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-md:hidden">
            O conteúdo que você procurava encontrou uma janela aberta e foi dar
            um mergulho no oceano. Nós iríamos atrás dele, mas esquecemos os
            nossos pés de pato.
          </p>

          <div className="max-md:hidden">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </div>

        <div className="md:col-start-2 md:row-start-1 md:row-span-3 flex justify-center">
          <Image
            src="/404/light.png"
            alt="Aquário vazio com placa 'Fui Pescar'"
            width={400}
            height={400}
            className="w-full max-w-xs sm:max-w-sm"
            priority
          />
        </div>

        {/* Mobile-only subtext and button (shown below image) */}
        <div className="flex flex-col gap-4 md:hidden">
          <p className="text-muted-foreground text-sm leading-relaxed">
            O conteúdo que você procurava encontrou uma janela aberta e foi dar
            um mergulho no oceano. Nós iríamos atrás dele, mas esquecemos os
            nossos pés de pato.
          </p>

          <Button variant="ghost" asChild className="w-fit">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
