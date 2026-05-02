"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchUsers } from "@/lib/client/hooks/use-usuarios";
import { useEntidades } from "@/lib/client/hooks/use-entidades";
import { getDefaultAvatarUrl } from "@/lib/client/utils";

export type CoAutor =
  | { kind: "user"; id: string; nome: string }
  | { kind: "entidade"; id: string; nome: string };

type Props = {
  value: CoAutor[];
  onChange: (next: CoAutor[]) => void;
  /** User IDs to hide from user search results (typically the current user). */
  excludeUserIds?: string[];
  /** Entidade IDs to hide from search results (typically the principal entidade). */
  excludeEntidadeIds?: string[];
  /** Max results to show per type. */
  limit?: number;
};

export function CoAutoresPicker({
  value,
  onChange,
  excludeUserIds = [],
  excludeEntidadeIds = [],
  limit = 8,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const trimmedQuery = searchQuery.trim();

  const { data: userSearch } = useSearchUsers(trimmedQuery, limit);
  const { data: allEntidades = [] } = useEntidades();

  const userResults = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    return (userSearch?.users ?? []).filter(u => !excludeUserIds.includes(u.id));
  }, [userSearch, excludeUserIds, trimmedQuery]);

  const entidadeResults = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    const q = trimmedQuery.toLowerCase();
    return allEntidades
      .filter(e => !excludeEntidadeIds.includes(e.id))
      .filter(e => e.name.toLowerCase().includes(q))
      .slice(0, limit);
  }, [allEntidades, excludeEntidadeIds, limit, trimmedQuery]);

  const isAlreadyAdded = (kind: CoAutor["kind"], id: string) =>
    value.some(v => v.kind === kind && v.id === id);

  const add = (autor: CoAutor) => {
    if (isAlreadyAdded(autor.kind, autor.id)) {
      return;
    }
    onChange([...value, autor]);
    setSearchQuery("");
  };

  const remove = (kind: CoAutor["kind"], id: string) => {
    onChange(value.filter(v => !(v.kind === kind && v.id === id)));
  };

  const showResults =
    trimmedQuery.length > 0 && (userResults.length > 0 || entidadeResults.length > 0);
  const showEmpty =
    trimmedQuery.length > 0 && userResults.length === 0 && entidadeResults.length === 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários ou entidades..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {showResults && (
        <div className="border rounded-lg max-h-64 overflow-y-auto bg-background p-1 space-y-1 shadow-sm">
          {userResults.map(u => {
            const added = isAlreadyAdded("user", u.id);
            return (
              <div
                key={`user-${u.id}`}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  added ? "bg-muted" : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => add({ kind: "user", id: u.id, nome: u.nome })}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border shrink-0">
                  <Image
                    src={u.urlFotoPerfil || getDefaultAvatarUrl(u.id, u.nome, u.eFacade)}
                    alt={u.nome}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Usuário
                </Badge>
                {added && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Adicionado
                  </Badge>
                )}
              </div>
            );
          })}
          {entidadeResults.map(e => {
            const added = isAlreadyAdded("entidade", e.id);
            return (
              <div
                key={`entidade-${e.id}`}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  added ? "bg-muted" : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => add({ kind: "entidade", id: e.id, nome: e.name })}
              >
                <div className="relative w-8 h-8 rounded-md overflow-hidden border bg-muted shrink-0">
                  {e.imagePath && (
                    <Image src={e.imagePath} alt={e.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  {e.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{e.subtitle}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Entidade
                </Badge>
                {added && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Adicionado
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showEmpty && (
        <p className="text-xs text-muted-foreground">Nenhum usuário ou entidade encontrado.</p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map(autor => (
            <Badge
              key={`${autor.kind}-${autor.id}`}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-1"
            >
              <span className="text-xs">{autor.nome}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-60">
                {autor.kind === "user" ? "" : "ent"}
              </span>
              <button
                type="button"
                onClick={() => remove(autor.kind, autor.id)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Remover ${autor.nome}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
