import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth-context";
import { getOwnSigaaAcademicState } from "@/lib/client/api/sigaa";
import { queryKeys } from "@/lib/client/query-keys";

export function useOwnSigaaAcademicState(enabled = true) {
  const { token, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.sigaa.state(userId),
    queryFn: getOwnSigaaAcademicState,
    enabled: enabled && Boolean(token && userId),
    staleTime: 60_000,
    retry: false,
  });
}
