"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUsuarios, useUpdateUserRole } from "@/hooks/use-usuarios";
import type { User } from "@/lib/api/usuarios";
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

export default function AdminPage() {
  const { user, isLoading: authLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // React Query hooks
  const { data: users = [], isLoading, error: queryError, refetch } = useUsuarios();
  const updateRoleMutation = useUpdateUserRole();

  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading) {
      return;
    }

    // If there's a token but no user, the auth context's logout() is handling the redirect
    // Don't duplicate the redirect to avoid race conditions
    if (token && !user) {
      return;
    }

    // Only redirect if there's no token and no user (truly not authenticated)
    if (!token && !user) {
      router.replace("/login");
      return;
    }

    // If we have a user, check their role
    if (user) {
      if (user.papelPlataforma !== "MASTER_ADMIN") {
        router.replace("/");
      }
    }
  }, [authLoading, isAuthenticated, user, token, router]);

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
  }, [searchQuery, users]);

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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(userItem => (
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
                        {/* Loading state is now handled by toast notifications */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: {filteredUsers.length} {filteredUsers.length === 1 ? "usuário" : "usuários"}
            {searchQuery && ` (de ${users.length} total)`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
