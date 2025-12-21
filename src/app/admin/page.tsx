"use client";

import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useUsuarios } from "@/lib/client/hooks/use-usuarios";
import { UsersTable } from "@/components/pages/admin/users-table";
import { EntidadesTable } from "@/components/pages/admin/entidades-table";
import { AdminPageSkeleton } from "@/components/pages/admin/admin-page-skeleton";
import { useBackend } from "@/lib/shared/config/env";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { isEnabled: backendEnabled } = useBackend();
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });
  const { isLoading } = useUsuarios();

  // Redirect to home if backend is disabled
  useEffect(() => {
    if (!backendEnabled) {
      router.replace("/");
    }
  }, [backendEnabled, router]);

  if (!backendEnabled) {
    return null;
  }

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
