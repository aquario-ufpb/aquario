/**
 * Test providers and utilities for React component testing
 * Includes React Query setup with proper configuration for tests
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, RenderHookOptions } from "@testing-library/react";

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component that provides React Query context
 */
type TestQueryProviderProps = {
  children: React.ReactNode;
  client?: QueryClient;
};

export function TestQueryProvider({ children, client }: TestQueryProviderProps) {
  const queryClient = client || createTestQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * Custom renderHook that wraps with QueryClientProvider
 * Usage: const { result } = renderHookWithProviders(() => useGuias('curso-slug'))
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & { client?: QueryClient }
) {
  const { client, ...renderOptions } = options || {};
  const queryClient = client || createTestQueryClient();

  return renderHook(hook, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <TestQueryProvider client={queryClient}>{children}</TestQueryProvider>
    ),
  });
}
