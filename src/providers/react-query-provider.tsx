"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

// Global error handler for queries
const handleQueryError = (error: unknown) => {
  // Don't show toast for expected errors (like 401/403 which are handled by auth)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized") || message.includes("token")) {
      return; // Auth errors handled by auth context
    }
  }

  // Show toast for unexpected errors
  toast.error("Erro ao carregar dados. Tente novamente.");
};

// Global error handler for mutations
const handleMutationError = (error: unknown) => {
  // Most mutations have their own error handling, but this catches uncaught ones
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized") || message.includes("token")) {
      return; // Auth errors handled by auth context
    }
  }

  // Only show generic error if mutation doesn't have its own onError
  toast.error("Erro ao salvar dados. Tente novamente.");
};

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: handleQueryError,
        }),
        mutationCache: new MutationCache({
          onError: handleMutationError,
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
