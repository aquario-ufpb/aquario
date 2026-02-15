"use client";

import { CalendarioManagement } from "@/components/pages/admin/calendario-management";

export default function AdminCalendarioAcademicoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário Acadêmico</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie semestres letivos e eventos do calendário acadêmico
        </p>
      </div>
      <CalendarioManagement />
    </div>
  );
}
