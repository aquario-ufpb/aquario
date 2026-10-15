import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { privateQueryKeys } from "@/lib/client/query-keys";
import {
  roomBindingSchema,
  type CalendarRoomBindingRequest,
} from "@/lib/shared/calendario/room-binding";
import { z } from "zod";

export function useCalendarRoomBindings(semester: string | undefined, enabled: boolean) {
  const { userId, token } = useAuth();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const courseId = user?.curso.id;
  const key = [...privateQueryKeys.byUser(userId), "calendar-room-bindings", courseId, semester];
  const query = useQuery({
    queryKey: key,
    enabled: enabled && !!semester && !!userId && !!token && !!courseId,
    queryFn: async () => {
      const response = await apiClient(
        `/usuarios/me/calendario/salas?semestre=${encodeURIComponent(semester ?? "")}`
      );
      if (!response.ok) {
        await throwApiError(response);
      }
      return z
        .object({ bindings: z.array(roomBindingSchema).max(64) })
        .parse(await response.json());
    },
    staleTime: 60000,
  });
  const mutation = useMutation({
    mutationFn: async (input: { sourceKey: string; allocationId: number | null }) => {
      if (!semester) {
        throw new Error("Selecione um semestre antes de escolher a sala.");
      }
      const body: CalendarRoomBindingRequest | { semester: string; sourceKey: string } =
        input.allocationId === null
          ? { semester, sourceKey: input.sourceKey }
          : { semester, sourceKey: input.sourceKey, allocationId: input.allocationId };
      const response = await apiClient("/usuarios/me/calendario/salas", {
        method: input.allocationId === null ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        await throwApiError(response);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["paas"] });
    },
  });
  return { ...query, mutation };
}
