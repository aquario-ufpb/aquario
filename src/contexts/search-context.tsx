"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SearchResult = {
  id: string;
  type: string;
  titulo?: string;
  nome?: string;
  conteudo?: string;
  descricao?: string;
};

type SearchContextType = {
  results: SearchResult[];
  search: (query: string) => Promise<void>;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      setResults([]);
    }
  };

  return <SearchContext.Provider value={{ results, search }}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
