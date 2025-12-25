"use client";

import { useState, useEffect } from "react";
import {
  useUsuariosPaginated,
  useUpdateUserRole,
  useDeleteUser,
  useCreateFacadeUser,
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
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { PaginationControls } from "@/components/shared/pagination-controls";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [isFacadeDialogOpen, setIsFacadeDialogOpen] = useState(false);
  const [facadeNome, setFacadeNome] = useState("");
  const [facadeCentroId, setFacadeCentroId] = useState("");
  const [facadeCursoId, setFacadeCursoId] = useState("");

  const {
    data: paginatedData,
    isLoading,
    error: queryError,
    refetch,
  } = useUsuariosPaginated({
    page,
    limit: itemsPerPage,
  });

  const users = paginatedData?.users ?? [];
  const totalUsers = paginatedData?.pagination.total ?? 0;
  const totalPages = paginatedData?.pagination.totalPages ?? 0;

  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const createFacadeUserMutation = useCreateFacadeUser();
  const { data: centros = [] } = useCentros();
  const { data: cursos = [] } = useCursos(facadeCentroId);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Painel de Administração</CardTitle>
        <CardDescription>Gerencie usuários e permissões da plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Carregando..." : "Nenhum usuário cadastrado"}
                  </td>
                </tr>
              ) : (
                users.map(userItem => (
                  <tr key={userItem.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">
                      {userItem.nome}
                      {userItem.eFacade && (
                        <span className="ml-2 text-xs text-muted-foreground">(Facade)</span>
                      )}
                    </td>
                    <td className="p-4">
                      {userItem.email || <span className="text-muted-foreground">—</span>}
                    </td>
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
          totalItems={totalUsers}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="usuário"
          itemLabelPlural="usuários"
        />
      </CardContent>
    </Card>
  );
}
