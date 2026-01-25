"use client";

import { UsersTable } from "@/components/pages/admin/users-table";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";

export default function AdminUsuariosPage() {
  const { data: user } = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie usuários da plataforma, roles e informações
        </p>
      </div>
      <UsersTable currentUserId={user.id} />
    </div>
  );
}
