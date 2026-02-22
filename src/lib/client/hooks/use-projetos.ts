import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { ProjetoWithAutores } from "@/lib/shared/types/projeto";

interface FetchProjetosParams {
  entidadeId?: string;
  usuarioId?: string;
  limit?: number;
}

// Função base para buscar projetos
async function fetchProjetos({
  entidadeId,
  usuarioId,
  limit = 50,
}: FetchProjetosParams): Promise<ProjetoWithAutores[]> {
  const params = new URLSearchParams();

  if (entidadeId) params.append("entidadeId", entidadeId);
  if (usuarioId) params.append("usuarioId", usuarioId);
  params.append("limit", limit.toString());

  const res = await fetch(`/api/projetos?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Erro ao buscar projetos");
  }

  const data = await res.json();
  return data.projetos as ProjetoWithAutores[];
}

// Projetos de uma entidade
export function useProjetosByEntidade(entidadeId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byEntidade(entidadeId ?? ""),
    queryFn: () => fetchProjetos({ entidadeId }),
    enabled: !!entidadeId,
    staleTime: 5 * 60 * 1000,
  });
}

// Projetos de um usuário (autor principal ou colaborador)
export function useProjetosByUsuario(usuarioId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byUsuario(usuarioId ?? ""),
    queryFn: () => fetchProjetos({ usuarioId }),
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
}

// Projetos de uma entidade onde o usuário participa
export function useProjetosDaEntidadeDoUsuario(entidadeId?: string, usuarioId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byEntidadeUsuario(entidadeId ?? "", usuarioId ?? ""),
    queryFn: () =>
      fetchProjetos({
        entidadeId,
        usuarioId,
      }),
    enabled: !!entidadeId && !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
}
