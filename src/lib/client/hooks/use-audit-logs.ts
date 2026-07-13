import { useQuery } from "@tanstack/react-query";
import { auditLogsService, type AuditLogListOptions } from "@/lib/client/api/audit-logs";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";

export const useAuditLogs = (options: AuditLogListOptions) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.auditLogs.paginated(options),
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return auditLogsService.list(token, options);
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
};
