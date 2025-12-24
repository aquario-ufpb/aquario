"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchPage from "@/components/shared/search-page";

function PesquisarContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  return (
    <main className="container mx-auto">
      <SearchPage query={query} />
    </main>
  );
}

export default function Pesquisar() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PesquisarContent />
    </Suspense>
  );
}
