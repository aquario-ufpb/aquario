"use client";

import { useEffect } from "react";
import { useSearch, SearchResult } from "@/contexts/search-context";
import SearchResultCard from "@/components/shared/search-card-result";

type SearchPageProps = {
  query: string | null;
};

const groupResultsByType = (results: SearchResult[]) => {
  return results.reduce(
    (acc, result) => {
      const type = result.type || "outros";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(result);
      return acc;
    },
    {} as { [key: string]: SearchResult[] }
  );
};

export default function SearchPage({ query }: SearchPageProps) {
  const { search, results } = useSearch();

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  const groupedResults = groupResultsByType(results);

  return (
    <div className="flex flex-col items-start justify-start pt-20">
      <h1 className="text-2xl font-bold mb-4">Resultados da Pesquisa por: {query}</h1>
      {results.length > 0 ? (
        <div className="w-full">
          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 capitalize">{type}s</h2>
              <div>
                {items.map(result => (
                  <SearchResultCard key={result.id} result={result} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhum resultado encontrado.</p>
      )}
    </div>
  );
}
