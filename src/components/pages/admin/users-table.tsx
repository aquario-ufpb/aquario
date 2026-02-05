"use client";

import { useState } from "react";
import {
  useUsuariosPaginated,
  useUpdateUserRole,
  useDeleteUser,
  useUpdateUserInfo,
  useUpdateUserSlug,
} from "@/lib/client/hooks/use-usuarios";
import { useCentros, useCursos } from "@/lib/client/hooks";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Search, Copy, Merge } from "lucide-react";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { FacadeUserDialog } from "./facade-user-dialog";
import { MergeFacadeDialog } from "./merge-facade-dialog";

type UserFilter = "all" | "facade" | "real";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCentroId, setEditCentroId] = useState("");
  const [editCursoId, setEditCursoId] = useState("");
  const [editingSlugUserId, setEditingSlugUserId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeFacadeUserId, setMergeFacadeUserId] = useState<string | null>(null);

  const {
    data: paginatedData,
    isLoading,
    error: queryError,
    refetch,
  } = useUsuariosPaginated({
    page,
    limit: itemsPerPage,
    filter: userFilter,
    search: searchQuery || undefined,
  });

  const users = paginatedData?.users ?? [];
  const totalUsers = paginatedData?.pagination?.total ?? 0;
  const totalPages = paginatedData?.pagination?.totalPages ?? 0;

  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const updateUserInfoMutation = useUpdateUserInfo();
  const updateUserSlugMutation = useUpdateUserSlug();
  const { data: centros = [] } = useCentros();
  const { data: editCursos = [] } = useCursos(editCentroId);

  const handleRoleUpdate = async (userId: string, newRole: "USER" | "MASTER_ADMIN") => {
    try {
      await updateRoleMutation.mutateAsync({ userId, papelPlataforma: newRole });
      const user = users.find(u => u.id === userId);
      toast.success("Papel atualizado", {
        description: `O papel de ${user?.nome || "o usuário"} foi atualizado para ${
          newRole === "MASTER_ADMIN" ? "Administrador" : "Usuário"
        }.`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar papel do usuário";
      toast.error("Erro ao atualizar papel", { description: errorMessage });
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar usuário";
      toast.error("Erro ao deletar usuário", { description: errorMessage });
    }
  };

  const handleStartEdit = (userId: string, centroId: string, cursoId: string) => {
    setEditingUserId(userId);
    setEditCentroId(centroId);
    setEditCursoId(cursoId);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditCentroId("");
    setEditCursoId("");
  };

  const handleSaveEdit = async (userId: string, userName: string) => {
    try {
      await updateUserInfoMutation.mutateAsync({
        userId,
        data: { centroId: editCentroId, cursoId: editCursoId },
      });
      toast.success("Informações atualizadas", {
        description: `As informações de ${userName} foram atualizadas.`,
      });
      handleCancelEdit();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar informações do usuário";
      toast.error("Erro ao atualizar informações", { description: errorMessage });
    }
  };

  const handleCopyId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      toast.success("ID copiado", {
        description: "O ID do usuário foi copiado para a área de transferência.",
      });
    } catch {
      toast.error("Erro ao copiar ID", {
        description: "Não foi possível copiar o ID para a área de transferência.",
      });
    }
  };

  const handleStartEditSlug = (userId: string, currentSlug: string | null) => {
    setEditingSlugUserId(userId);
    setEditSlug(currentSlug || "");
  };

  const handleCancelEditSlug = () => {
    setEditingSlugUserId(null);
    setEditSlug("");
  };

  const handleSaveSlug = async (userId: string, userName: string) => {
    try {
      await updateUserSlugMutation.mutateAsync({
        userId,
        slug: editSlug.trim() || null,
      });
      toast.success("Slug atualizado", {
        description: `O slug de ${userName} foi atualizado.`,
      });
      handleCancelEditSlug();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar slug";
      toast.error("Erro ao atualizar slug", { description: errorMessage });
    }
  };

  const handleStartMerge = (facadeUserId: string) => {
    setMergeFacadeUserId(facadeUserId);
    setIsMergeDialogOpen(true);
  };

  const mergeFacadeUser = users.find(u => u.id === mergeFacadeUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Painel de Administração</CardTitle>
        <CardDescription>Gerencie usuários e permissões da plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <FacadeUserDialog disabled={isLoading} />
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            Atualizar
          </Button>

          <div className="flex items-center gap-2">
            <Label htmlFor="user-filter" className="text-sm font-medium">
              Filtrar:
            </Label>
            <Select
              value={userFilter}
              onValueChange={(value: UserFilter) => {
                setUserFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="user-filter" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="facade">Apenas Facade</SelectItem>
                <SelectItem value="real">Apenas Reais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Buscar por nome, email, centro ou curso..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
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
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Nome</th>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Slug</th>
                <th className="text-left p-4 font-semibold">Centro</th>
                <th className="text-left p-4 font-semibold">Curso</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Papel</th>
                <th className="text-right p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Carregando..." : "Nenhum usuário cadastrado"}
                  </td>
                </tr>
              ) : (
                users.map(userItem => {
                  const isEditing = editingUserId === userItem.id;
                  const isEditingSlug = editingSlugUserId === userItem.id;
                  return (
                    <tr key={userItem.id} className="border-b hover:bg-muted/50">
                      {/* ID Column */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleCopyId(userItem.id)}
                          className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group cursor-pointer"
                          title="Clique para copiar o ID"
                        >
                          <span>{userItem.id}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Nome Column */}
                      <td className="p-4 font-medium">
                        {userItem.nome}
                        {userItem.eFacade && (
                          <span className="ml-2 text-xs text-muted-foreground">(Facade)</span>
                        )}
                      </td>

                      {/* Email Column */}
                      <td className="p-4">
                        {userItem.email || <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Slug Column */}
                      <td className="p-4">
                        {isEditingSlug ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editSlug}
                              onChange={e => setEditSlug(e.target.value)}
                              placeholder="slug"
                              className="w-32 font-mono text-sm"
                              disabled={updateUserSlugMutation.isPending}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditSlug}
                              disabled={updateUserSlugMutation.isPending}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSaveSlug(userItem.id, userItem.nome)}
                              disabled={updateUserSlugMutation.isPending}
                            >
                              {updateUserSlugMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {userItem.slug || <span className="text-muted-foreground">—</span>}
                            </span>
                            {!userItem.eFacade && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleStartEditSlug(userItem.id, userItem.slug || null)
                                }
                                className="h-6 px-2 text-xs"
                              >
                                Editar
                              </Button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Centro Column */}
                      <td className="p-4">
                        {isEditing ? (
                          <Select value={editCentroId} onValueChange={setEditCentroId}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {centros.map(centro => (
                                <SelectItem key={centro.id} value={centro.id}>
                                  {centro.sigla}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          userItem.centro.sigla
                        )}
                      </td>

                      {/* Curso Column */}
                      <td className="p-4">
                        {isEditing ? (
                          <Select
                            value={editCursoId}
                            onValueChange={setEditCursoId}
                            disabled={!editCentroId}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {editCursos.map(curso => (
                                <SelectItem key={curso.id} value={curso.id}>
                                  {curso.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          userItem.curso.nome
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {userItem.eVerificado ? (
                            <>
                              <svg
                                className="w-4 h-4 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
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
                                aria-hidden="true"
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

                      {/* Papel Column */}
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

                      {/* Ações Column */}
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={updateUserInfoMutation.isPending}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSaveEdit(userItem.id, userItem.nome)}
                                disabled={
                                  updateUserInfoMutation.isPending || !editCentroId || !editCursoId
                                }
                              >
                                {updateUserInfoMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </>
                          ) : (
                            <>
                              {userItem.eFacade && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartMerge(userItem.id)}
                                  title="Mesclar com usuário real"
                                >
                                  <Merge className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStartEdit(
                                    userItem.id,
                                    userItem.centro.id,
                                    userItem.curso.id
                                  )
                                }
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(userItem.id, userItem.nome)}
                                disabled={
                                  (deleteUserMutation.isPending &&
                                    deleteUserMutation.variables === userItem.id) ||
                                  userItem.id === currentUserId
                                }
                                className="gap-2"
                                title={
                                  userItem.id === currentUserId
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="usuário"
          itemLabelPlural="usuários"
        />
      </CardContent>

      <MergeFacadeDialog
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        facadeUserId={mergeFacadeUserId}
        facadeUserName={mergeFacadeUser?.nome || ""}
        availableUsers={users}
      />
    </Card>
  );
}
