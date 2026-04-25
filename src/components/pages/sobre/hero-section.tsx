"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden bg-slate-50 pt-24 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="container relative z-30 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center drop-shadow-[0_18px_32px_rgba(14,58,108,0.18)] dark:drop-shadow-[0_18px_32px_rgba(125,211,252,0.16)]">
            <Image
              src="/vector3.svg"
              alt="Logo do Aquário"
              width={80}
              height={80}
              className="h-auto w-full dark:hidden"
            />
            <Image
              src="/vector4.svg"
              alt="Logo do Aquário"
              width={80}
              height={80}
              className="hidden h-auto w-full dark:block"
            />
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-aquario-primary dark:text-white md:text-6xl lg:text-7xl">
            Sobre o Aquário
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
            Um projeto open source feito para centralizar informações relevantes e aproximar a
            comunidade acadêmica do Centro de Informática da UFPB.
          </p>
          <div className="mt-10 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-aquario-primary px-8 text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-aquario-primary/90"
            >
              <Link
                href="https://github.com/aquario-ufpb/aquario"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                Contribua para o Aquário
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
