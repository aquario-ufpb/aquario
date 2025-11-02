import * as React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

type SubSectionNode = {
  titulo: string;
  slug: string;
};

type SectionNode = {
  titulo: string;
  slug: string;
  subsecoes?: SubSectionNode[];
};

type GuiaNode = {
  titulo: string;
  slug: string;
  secoes: SectionNode[];
};

type GuideIndexProps = {
  cursoSlug: string;
  guias: GuiaNode[];
};

const inter = Inter({ subsets: ["latin"] });

export const GuideIndex: React.FC<GuideIndexProps> = ({ cursoSlug, guias }) => {
  return (
    <div className="flex h-[100vh] overflow-y-auto ">
      <div className={`space-y-4 w-full top-0 left-0 p-4 ${inter.className}`}>
        {guias.map(guia => (
          <div key={guia.slug}>
            <p className="text-sm mb-1 ml-6 text-gray-500">{guia.titulo}</p>
            {guia.secoes.map(secao => (
              <div key={secao.slug} className="ml-6">
                <Link href={`/guias/${cursoSlug}/${guia.slug}/${secao.slug}`}>
                  <p className="py-1.5 hover:underline">{secao.titulo}</p>
                </Link>
                {secao.subsecoes?.map(sub => (
                  <Link
                    key={sub.slug}
                    href={`/guias/${cursoSlug}/${guia.slug}/${secao.slug}/${sub.slug}`}
                  >
                    <p className="ml-4 py-1 hover:underline">{sub.titulo}</p>
                  </Link>
                ))}
              </div>
            ))}
            <div className="h-[1.5px] w-full rounded bg-gray-500 opacity-30 mt-2 ml-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuideIndex;
