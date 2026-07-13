"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useAuditLogs } from "@/lib/client/hooks/use-audit-logs";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatMetadata(metadata: unknown): string {
  if (!metadata || (typeof metadata === "object" && Object.keys(metadata).length === 0)) {
    return "-";
  }

  return JSON.stringify(metadata);
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");

  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    limit: itemsPerPage,
    action: actionFilter.trim() || undefined,
    resourceType: resourceTypeFilter.trim() || undefined,
  });

  const auditLogs = data?.auditLogs ?? [];
  const totalLogs = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  const clearFilters = () => {
    setActionFilter("");
    setResourceTypeFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Registros internos de ações administrativas sensíveis
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Eventos registrados
              </CardTitle>
              <CardDescription>
                Filtre por ação ou tipo de recurso para investigar alterações recentes.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="audit-action-filter">Ação</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="audit-action-filter"
                  value={actionFilter}
                  onChange={event => {
                    setActionFilter(event.target.value);
                    setPage(1);
                  }}
                  placeholder="usuario.role.updated"
                  className="pl-9 font-mono"
                />
              </div>
            </div>
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="audit-resource-filter">Recurso</Label>
              <Input
                id="audit-resource-filter"
                value={resourceTypeFilter}
                onChange={event => {
                  setResourceTypeFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="usuario"
                className="mt-2 font-mono"
              />
            </div>
            <Button variant="ghost" onClick={clearFilters}>
              Limpar
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error instanceof Error ? error.message : "Falha ao carregar audit logs"}
              </p>
            </div>
          )}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-semibold">Data</th>
                  <th className="p-4 text-left font-semibold">Ator</th>
                  <th className="p-4 text-left font-semibold">Ação</th>
                  <th className="p-4 text-left font-semibold">Recurso</th>
                  <th className="p-4 text-left font-semibold">IP</th>
                  <th className="p-4 text-left font-semibold">Metadados</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4" colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={6}>
                      Nenhum evento registrado
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="whitespace-nowrap p-4 text-sm">
                        {formatDateTime(log.criadoEm)}
                      </td>
                      <td className="p-4">
                        {log.actorUsuario ? (
                          <div>
                            <div className="font-medium">{log.actorUsuario.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.actorUsuario.email || log.actorUsuario.id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Usuário removido</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{log.action}</td>
                      <td className="p-4">
                        <div className="font-mono text-sm">{log.resourceType}</div>
                        {log.resourceId && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {log.resourceId}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm text-muted-foreground">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="max-w-sm p-4">
                        <code className="block truncate rounded bg-muted px-2 py-1 text-xs">
                          {formatMetadata(log.metadata)}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalLogs}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={newLimit => {
              setItemsPerPage(newLimit);
              setPage(1);
            }}
            itemLabel="evento"
            itemLabelPlural="eventos"
          />
        </CardContent>
      </Card>
    </div>
  );
}
