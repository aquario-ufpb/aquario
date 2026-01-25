"use client";

import { EntidadesTable } from "@/components/pages/admin/entidades-table";

export default function AdminEntidadesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Entidades</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie laboratórios, grupos de pesquisa e outras entidades
        </p>
      </div>
      <EntidadesTable />
    </div>
  );
}
