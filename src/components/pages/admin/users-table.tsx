"use client";

import { useState, useEffect } from "react";
import {
  useUsuariosPaginated,
  useUpdateUserRole,
  useDeleteUser,
  useCreateFacadeUser,
  useUpdateUserInfo,
  useMergeFacadeUser,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, UserPlus, Search, Copy, Merge } from "lucide-react";
import { PaginationControls } from "@/components/shared/pagination-controls";

type UserFilter = "all" | "facade" | "real";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [isFacadeDialogOpen, setIsFacadeDialogOpen] = useState(false);
  const [facadeNome, setFacadeNome] = useState("");
  const [facadeCentroId, setFacadeCentroId] = useState("");
  const [facadeCursoId, setFacadeCursoId] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCentroId, setEditCentroId] = useState("");
  const [editCursoId, setEditCursoId] = useState("");
  const [editingSlugUserId, setEditingSlugUserId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeFacadeUserId, setMergeFacadeUserId] = useState<string | null>(null);
  const [mergeRealUserId, setMergeRealUserId] = useState("");
  const [mergeDeleteFacade, setMergeDeleteFacade] = useState(true);

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
  const createFacadeUserMutation = useCreateFacadeUser();
  const updateUserInfoMutation = useUpdateUserInfo();
  const updateUserSlugMutation = useUpdateUserSlug();
  const mergeFacadeUserMutation = useMergeFacadeUser();
  const { data: centros = [] } = useCentros();
  const { data: cursos = [] } = useCursos(facadeCentroId);
  const { data: editCursos = [] } = useCursos(editCentroId);

  // Auto-select first centro when dialog opens and centros are available
  useEffect(() => {
    if (isFacadeDialogOpen && centros.length > 0 && !facadeCentroId) {
      setFacadeCentroId(centros[0].id);
    }
  }, [isFacadeDialogOpen, centros, facadeCentroId]);

  // Auto-select first curso when centro is selected and cursos are available
  useEffect(() => {
    if (facadeCentroId && cursos.length > 0 && !facadeCursoId) {
      setFacadeCursoId(cursos[0].id);
    } else if (!facadeCentroId) {
      setFacadeCursoId("");
    }
  }, [facadeCentroId, cursos, facadeCursoId]);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar usuário";
      toast.error("Erro ao deletar usuário", {
        description: errorMessage,
      });
    }
  };

  const handleCreateFacadeUser = async () => {
    if (!facadeNome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!facadeCentroId) {
      toast.error("Centro é obrigatório");
      return;
    }
    if (!facadeCursoId) {
      toast.error("Curso é obrigatório");
      return;
    }

    try {
      await createFacadeUserMutation.mutateAsync({
        nome: facadeNome.trim(),
        centroId: facadeCentroId,
        cursoId: facadeCursoId,
      });
      toast.success("Usuário facade criado", {
        description: `${facadeNome} foi criado como usuário facade.`,
      });
      setIsFacadeDialogOpen(false);
      setFacadeNome("");
      setFacadeCentroId("");
      setFacadeCursoId("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar usuário facade";
      toast.error("Erro ao criar usuário facade", {
        description: errorMessage,
      });
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
        data: {
          centroId: editCentroId,
          cursoId: editCursoId,
        },
      });
      toast.success("Informações atualizadas", {
        description: `As informações de ${userName} foram atualizadas.`,
      });
      setEditingUserId(null);
      setEditCentroId("");
      setEditCursoId("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar informações do usuário";
      toast.error("Erro ao atualizar informações", {
        description: errorMessage,
      });
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
      setEditingSlugUserId(null);
      setEditSlug("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar slug";
      toast.error("Erro ao atualizar slug", {
        description: errorMessage,
      });
    }
  };

  const handleStartMerge = (facadeUserId: string) => {
    setMergeFacadeUserId(facadeUserId);
    setMergeRealUserId("");
    setMergeDeleteFacade(true);
    setIsMergeDialogOpen(true);
  };

  const handleMergeFacadeUser = async () => {
    if (!mergeFacadeUserId || !mergeRealUserId) {
      toast.error("Selecione o usuário real para mesclar");
      return;
    }

    if (mergeFacadeUserId === mergeRealUserId) {
      toast.error("Não é possível mesclar um usuário com ele mesmo");
      return;
    }

    try {
      const result = await mergeFacadeUserMutation.mutateAsync({
        facadeUserId: mergeFacadeUserId,
        realUserId: mergeRealUserId,
        deleteFacade: mergeDeleteFacade,
      });

      toast.success("Usuário facade mesclado", {
        description: `${result.membershipsCopied} membros copiados. ${
          result.conflicts > 0 ? `${result.conflicts} conflitos ignorados. ` : ""
        }${result.facadeUserDeleted ? "Usuário facade deletado." : "Usuário facade mantido."}`,
      });

      setIsMergeDialogOpen(false);
      setMergeFacadeUserId(null);
      setMergeRealUserId("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao mesclar usuário facade";
      toast.error("Erro ao mesclar usuário facade", {
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Painel de Administração</CardTitle>
        <CardDescription>Gerencie usuários e permissões da plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Dialog open={isFacadeDialogOpen} onOpenChange={setIsFacadeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" disabled={isLoading}>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Usuário Facade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Usuário Facade</DialogTitle>
                <DialogDescription>
                  Crie um usuário facade para exibição pública. Este usuário não poderá fazer login
                  até que seja mesclado com uma conta real.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="facade-nome">Nome *</Label>
                  <Input
                    id="facade-nome"
                    placeholder="Nome do usuário"
                    value={facadeNome}
                    onChange={e => setFacadeNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facade-centro">Centro *</Label>
                  <Select value={facadeCentroId} onValueChange={setFacadeCentroId}>
                    <SelectTrigger id="facade-centro">
                      <SelectValue placeholder="Selecione um centro" />
                    </SelectTrigger>
                    <SelectContent>
                      {centros.map(centro => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.nome} ({centro.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facade-curso">Curso *</Label>
                  <Select
                    value={facadeCursoId}
                    onValueChange={setFacadeCursoId}
                    disabled={!facadeCentroId}
                  >
                    <SelectTrigger id="facade-curso">
                      <SelectValue
                        placeholder={
                          !facadeCentroId ? "Selecione um centro primeiro" : "Selecione um curso"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map(curso => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsFacadeDialogOpen(false)}
                  disabled={createFacadeUserMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateFacadeUser}
                  disabled={
                    createFacadeUserMutation.isPending ||
                    !facadeNome ||
                    !facadeCentroId ||
                    !facadeCursoId
                  }
                >
                  {createFacadeUserMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                setPage(1); // Reset to first page when filter changes
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
                  setPage(1); // Reset to first page when search changes
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
                      <td className="p-4 font-medium">
                        {userItem.nome}
                        {userItem.eFacade && (
                          <span className="ml-2 text-xs text-muted-foreground">(Facade)</span>
                        )}
                      </td>
                      <td className="p-4">
                        {userItem.email || <span className="text-muted-foreground">—</span>}
                      </td>
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

      {/* Merge Facade User Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesclar Usuário Facade</DialogTitle>
            <DialogDescription>
              Mescle as membros do usuário facade em um usuário real. Os membros conflitantes serão
              ignorados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="merge-facade-user">Usuário Facade</Label>
              <Input
                id="merge-facade-user"
                value={
                  mergeFacadeUserId
                    ? users.find(u => u.id === mergeFacadeUserId)?.nome || mergeFacadeUserId
                    : ""
                }
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merge-real-user">Usuário Real *</Label>
              <Select value={mergeRealUserId} onValueChange={setMergeRealUserId}>
                <SelectTrigger id="merge-real-user">
                  <SelectValue placeholder="Selecione o usuário real" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => !u.eFacade && u.id !== mergeFacadeUserId)
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome} {user.email ? `(${user.email})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="merge-delete-facade"
                checked={mergeDeleteFacade}
                onCheckedChange={checked => setMergeDeleteFacade(checked === true)}
              />
              <Label htmlFor="merge-delete-facade" className="text-sm font-normal cursor-pointer">
                Deletar usuário facade após mesclar
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMergeDialogOpen(false);
                setMergeFacadeUserId(null);
                setMergeRealUserId("");
              }}
              disabled={mergeFacadeUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMergeFacadeUser}
              disabled={mergeFacadeUserMutation.isPending || !mergeRealUserId}
            >
              {mergeFacadeUserMutation.isPending ? "Mesclando..." : "Mesclar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
