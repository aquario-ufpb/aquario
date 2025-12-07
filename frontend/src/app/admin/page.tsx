"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUsuarios } from "@/hooks/use-usuarios";
import { UsersTable } from "@/components/pages/admin/users-table";
import { EntidadesTable } from "@/components/pages/admin/entidades-table";
import { AdminPageSkeleton } from "@/components/pages/admin/admin-page-skeleton";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });
  const { isLoading } = useUsuarios();

  if (authLoading || isLoading) {
    return <AdminPageSkeleton />;
  }

  if (!user || user.papelPlataforma !== "MASTER_ADMIN") {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 pt-24">
      <UsersTable currentUserId={user.id} />
      <EntidadesTable />
    </div>
  );
}
