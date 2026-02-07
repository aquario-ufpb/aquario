"use client";

import { CursosManagement } from "@/components/pages/admin/cursos-management";

export default function AdminCursosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cursos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie campus, centros e cursos da universidade
        </p>
      </div>
      <CursosManagement />
    </div>
  );
}
