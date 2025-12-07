"use client";

import { useState, useEffect } from "react";
import { entidadesService } from "@/lib/api/entidades";
import type { Entidade } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { PaginationControls } from "@/components/shared/pagination-controls";

export function EntidadesTable() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [filteredEntidades, setFilteredEntidades] = useState<Entidade[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Fetch entidades
  useEffect(() => {
    const fetchEntidades = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await entidadesService.getAll();
        setEntidades(data);
        setFilteredEntidades(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Falha ao carregar entidades");
        setError(error);
        toast.error("Erro ao carregar entidades", {
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntidades();
  }, []);

  // Filter entidades by ID, name, or slug
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEntidades(entidades);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEntidades(
        entidades.filter(
          e =>
            e.id.toLowerCase().includes(query) ||
            e.name.toLowerCase().includes(query) ||
            e.slug.toLowerCase().includes(query)
        )
      );
    }
    setPage(1);
  }, [searchQuery, entidades]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntidades = filteredEntidades.slice(startIndex, endIndex);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await entidadesService.getAll();
      setEntidades(data);
      setFilteredEntidades(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Falha ao carregar entidades");
      setError(error);
      toast.error("Erro ao carregar entidades", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Entidades</CardTitle>
        <CardDescription>Lista de todas as entidades cadastradas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Buscar por ID, nome ou slug..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            Atualizar
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Nome</th>
                  <th className="text-left p-4 font-semibold">Slug</th>
                  <th className="text-left p-4 font-semibold">Tipo</th>
                  <th className="text-left p-4 font-semibold">Centro</th>
                  <th className="text-right p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntidades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Nenhuma entidade encontrada" : "Nenhuma entidade cadastrada"}
                    </td>
                  </tr>
                ) : (
                  paginatedEntidades.map(entidade => (
                    <tr key={entidade.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {entidade.id.substring(0, 8)}...
                      </td>
                      <td className="p-4 font-medium">{entidade.name}</td>
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{entidade.slug}</code>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{entidade.tipo.replace("_", " ")}</span>
                      </td>
                      <td className="p-4 text-sm">
                        {entidade.centro ? (
                          <span className="font-medium">{entidade.centro.sigla}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/entidade/${entidade.slug}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Ver
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredEntidades.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="entidade"
          itemLabelPlural="entidades"
          totalItemsLabel={searchQuery ? entidades.length.toString() : undefined}
          showTotalFromUnfiltered={!!searchQuery}
        />
      </CardContent>
    </Card>
  );
}
