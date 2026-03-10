import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { searchService } from "@/lib/client/api/search";
import { queryKeys } from "@/lib/client/query-keys";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useSearch(query: string, limit = 5) {
  const debouncedQuery = useDebounce(query.trim(), 300);
  const enabled = debouncedQuery.length >= 3;

  return useQuery({
    queryKey: queryKeys.search.query(debouncedQuery),
    queryFn: () => searchService.search(debouncedQuery, limit),
    enabled,
    staleTime: 60 * 1000,
  });
}
