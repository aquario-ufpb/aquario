"use client";

import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useCurrentUser, useUsuariosPaginated } from "@/lib/client/hooks/use-usuarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, UserCheck, UserX, BarChart3, ExternalLink } from "lucide-react";
import { useEntidades } from "@/lib/client/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: usuariosData, isLoading: usuariosLoading } = useUsuariosPaginated({
    page: 1,
    limit: 1000,
    filter: "all",
  });
  const { data: entidades = [], isLoading: entidadesLoading } = useEntidades();

  if (authLoading || userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || user.papelPlataforma !== "MASTER_ADMIN") {
    return null;
  }

  const isLoading = usuariosLoading || entidadesLoading;
  const totalUsers = usuariosData?.pagination.total ?? 0;
  const totalEntidades = entidades.length;
  const allUsers = usuariosData?.users ?? [];
  const realUsers = allUsers.filter(u => !u.eFacade).length;
  const facadeUsers = allUsers.filter(u => u.eFacade).length;
  const verifiedUsers = allUsers.filter(u => u.eVerificado).length;
  const unverifiedUsers = allUsers.filter(u => !u.eVerificado).length;

  const stats = [
    {
      title: "Total de Usuários",
      value: isLoading ? "..." : totalUsers.toLocaleString("pt-BR"),
      icon: Users,
      description: `${realUsers} reais, ${facadeUsers} facade`,
    },
    {
      title: "Entidades",
      value: isLoading ? "..." : totalEntidades.toLocaleString("pt-BR"),
      icon: Building2,
      description: "Total de entidades cadastradas",
    },
    {
      title: "Usuários Verificados",
      value: isLoading ? "..." : verifiedUsers.toLocaleString("pt-BR"),
      icon: UserCheck,
      description: "Usuários com email verificado",
    },
    {
      title: "Usuários Não Verificados",
      value: isLoading ? "..." : unverifiedUsers.toLocaleString("pt-BR"),
      icon: UserX,
      description: "Aguardando verificação",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral da plataforma e estatísticas principais
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Gerencie usuários, entidades e configurações da plataforma através do menu lateral.
            </p>
            <Link href="/metrics" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Métricas (PostHog)
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use o painel de administração para gerenciar todos os aspectos da plataforma Aquário.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
