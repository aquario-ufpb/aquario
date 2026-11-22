import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  /** Data da última atualização, já formatada (ex.: "22 de novembro de 2026"). */
  updatedAt: string;
  children: ReactNode;
};

/** Layout das páginas de texto institucional (privacidade, exclusão de conta). */
export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <main className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <article className="prose prose-slate mx-auto max-w-3xl px-4 py-16 dark:prose-invert md:py-24">
        <h1 className="font-display">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Última atualização: {updatedAt}
        </p>
        {children}
      </article>
    </main>
  );
}
