"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { useState, useEffect } from "react";
import { useUsuarios, useUpdateUserRole, useDeleteUser } from "@/hooks/use-usuarios";
import type { User } from "@/lib/api/usuarios";
import { entidadesService } from "@/lib/api/entidades";
import type { Entidade } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

export default function AdminPage() {
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state for users
  const [usersPage, setUsersPage] = useState(1);
  const [usersItemsPerPage, setUsersItemsPerPage] = useState<number>(25);

  // Entidades state
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [filteredEntidades, setFilteredEntidades] = useState<Entidade[]>([]);
  const [entidadesSearchQuery, setEntidadesSearchQuery] = useState("");
  const [isLoadingEntidades, setIsLoadingEntidades] = useState(false);
  const [entidadesError, setEntidadesError] = useState<Error | null>(null);

  // Pagination state for entidades
  const [entidadesPage, setEntidadesPage] = useState(1);
  const [entidadesItemsPerPage, setEntidadesItemsPerPage] = useState<number>(25);

  // React Query hooks
  const { data: users = [], isLoading, error: queryError, refetch } = useUsuarios();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  // Fetch entidades
  useEffect(() => {
    const fetchEntidades = async () => {
      setIsLoadingEntidades(true);
      setEntidadesError(null);
      try {
        const data = await entidadesService.getAll();
        setEntidades(data);
        setFilteredEntidades(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Falha ao carregar entidades");
        setEntidadesError(error);
        toast.error("Erro ao carregar entidades", {
          description: error.message,
        });
      } finally {
        setIsLoadingEntidades(false);
      }
    };

    fetchEntidades();
  }, []);

  // Filter users
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          u =>
            u.nome.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.centro.nome.toLowerCase().includes(query) ||
            u.curso.nome.toLowerCase().includes(query)
        )
      );
    }
    // Reset to first page when search changes
    setUsersPage(1);
  }, [searchQuery, users]);

  // Filter entidades by ID, name, or slug
  useEffect(() => {
    if (entidadesSearchQuery.trim() === "") {
      setFilteredEntidades(entidades);
    } else {
      const query = entidadesSearchQuery.toLowerCase();
      setFilteredEntidades(
        entidades.filter(
          e =>
            e.id.toLowerCase().includes(query) ||
            e.name.toLowerCase().includes(query) ||
            e.slug.toLowerCase().includes(query)
        )
      );
    }
    // Reset to first page when search changes
    setEntidadesPage(1);
  }, [entidadesSearchQuery, entidades]);

  // Calculate pagination for users
  const usersTotalPages = Math.ceil(filteredUsers.length / usersItemsPerPage);
  const usersStartIndex = (usersPage - 1) * usersItemsPerPage;
  const usersEndIndex = usersStartIndex + usersItemsPerPage;
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex);

  // Calculate pagination for entidades
  const entidadesTotalPages = Math.ceil(filteredEntidades.length / entidadesItemsPerPage);
  const entidadesStartIndex = (entidadesPage - 1) * entidadesItemsPerPage;
  const entidadesEndIndex = entidadesStartIndex + entidadesItemsPerPage;
  const paginatedEntidades = filteredEntidades.slice(entidadesStartIndex, entidadesEndIndex);

  const handleRoleUpdate = async (userId: string, newRole: "USER" | "MASTER_ADMIN") => {
    try {
      await updateRoleMutation.mutateAsync({ userId, papelPlataforma: newRole });
      const user = users.find(u => u.id === userId);
      toast.success("Papel atualizado", {
        description: `O papel de ${user?.nome || "o usuário"} foi atualizado para ${
          newRole === "MASTER_ADMIN" ? "Administrador" : "Usuário"
        }.`,
      });
      // React Query will automatically refetch the users list
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar papel do usuário";
      toast.error("Erro ao atualizar papel", {
        description: errorMessage,
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success("Usuário deletado", {
        description: `${userName} foi removido da plataforma.`,
      });
      // React Query will automatically refetch the users list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar usuário";
      toast.error("Erro ao deletar usuário", {
        description: errorMessage,
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 pt-24">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || user.papelPlataforma !== "MASTER_ADMIN") {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 pt-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Painel de Administração</CardTitle>
          <CardDescription>Gerencie usuários e permissões da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, email, centro ou curso..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
              Atualizar
            </Button>
          </div>

          {queryError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {queryError instanceof Error ? queryError.message : "Falha ao carregar usuários"}
              </p>
            </div>
          )}

          {updateRoleMutation.isError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {updateRoleMutation.error instanceof Error
                  ? updateRoleMutation.error.message
                  : "Erro ao atualizar papel do usuário"}
              </p>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Nome</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Centro</th>
                  <th className="text-left p-4 font-semibold">Curso</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Papel</th>
                  <th className="text-right p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(userItem => (
                    <tr key={userItem.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{userItem.nome}</td>
                      <td className="p-4">{userItem.email}</td>
                      <td className="p-4">{userItem.centro.sigla}</td>
                      <td className="p-4">{userItem.curso.nome}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {userItem.eVerificado ? (
                            <>
                              <svg
                                className="w-4 h-4 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-sm">Verificado</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <span className="text-sm">Não verificado</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Select
                          value={userItem.papelPlataforma}
                          onValueChange={(value: "USER" | "MASTER_ADMIN") =>
                            handleRoleUpdate(userItem.id, value)
                          }
                          disabled={
                            updateRoleMutation.isPending &&
                            updateRoleMutation.variables?.userId === userItem.id
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Usuário</SelectItem>
                            <SelectItem value="MASTER_ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(userItem.id, userItem.nome)}
                          disabled={
                            (deleteUserMutation.isPending &&
                              deleteUserMutation.variables === userItem.id) ||
                            userItem.id === user?.id
                          }
                          className="gap-2"
                          title={
                            userItem.id === user?.id
                              ? "Você não pode deletar sua própria conta"
                              : "Deletar usuário"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteUserMutation.isPending &&
                          deleteUserMutation.variables === userItem.id
                            ? "Deletando..."
                            : "Deletar"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Users */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select
                  value={usersItemsPerPage.toString()}
                  onValueChange={value => {
                    setUsersItemsPerPage(Number(value));
                    setUsersPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {usersPage} de {usersTotalPages} ({filteredUsers.length}{" "}
                  {filteredUsers.length === 1 ? "usuário" : "usuários"}
                  {searchQuery && ` de ${users.length} total`})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                  disabled={usersPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                  disabled={usersPage === usersTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entidades Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Entidades</CardTitle>
          <CardDescription>Lista de todas as entidades cadastradas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por ID, nome ou slug..."
              value={entidadesSearchQuery}
              onChange={e => setEntidadesSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={async () => {
                setIsLoadingEntidades(true);
                setEntidadesError(null);
                try {
                  const data = await entidadesService.getAll();
                  setEntidades(data);
                  setFilteredEntidades(data);
                } catch (err) {
                  const error =
                    err instanceof Error ? err : new Error("Falha ao carregar entidades");
                  setEntidadesError(error);
                  toast.error("Erro ao carregar entidades", {
                    description: error.message,
                  });
                } finally {
                  setIsLoadingEntidades(false);
                }
              }}
              variant="outline"
              disabled={isLoadingEntidades}
            >
              Atualizar
            </Button>
          </div>

          {entidadesError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{entidadesError.message}</p>
            </div>
          )}

          {isLoadingEntidades ? (
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
                        {entidadesSearchQuery
                          ? "Nenhuma entidade encontrada"
                          : "Nenhuma entidade cadastrada"}
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
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {entidade.slug}
                          </code>
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

          {/* Pagination Controls for Entidades */}
          {filteredEntidades.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select
                  value={entidadesItemsPerPage.toString()}
                  onValueChange={value => {
                    setEntidadesItemsPerPage(Number(value));
                    setEntidadesPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {entidadesPage} de {entidadesTotalPages} ({filteredEntidades.length}{" "}
                  {filteredEntidades.length === 1 ? "entidade" : "entidades"}
                  {entidadesSearchQuery && ` de ${entidades.length} total`})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntidadesPage(prev => Math.max(1, prev - 1))}
                  disabled={entidadesPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntidadesPage(prev => Math.min(entidadesTotalPages, prev + 1))}
                  disabled={entidadesPage === entidadesTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
