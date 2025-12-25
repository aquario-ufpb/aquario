"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEntidadeCargos } from "@/lib/client/hooks/use-entidades";
import type { Entidade } from "@/lib/shared/types";
import { MembersTable } from "./members-table";
import { AddMemberForm } from "./add-member-form";
import { CargoManagement } from "./cargo-management";

type ManageMembershipsDialogProps = {
  entidade: Entidade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageMembershipsDialog({
  entidade,
  open,
  onOpenChange,
}: ManageMembershipsDialogProps) {
  const [activeTab, setActiveTab] = useState("members");
  const { data: cargos = [] } = useEntidadeCargos(entidade.id);

  const members = entidade.membros || [];

  // Reset tab when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("members");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros</DialogTitle>
          <DialogDescription>
            Gerencie os membros desta entidade, seus cargos e permissões.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Gerenciar Membros</TabsTrigger>
            <TabsTrigger value="cargos">Gerenciar Cargos</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-hidden flex flex-col mt-4">
            <AddMemberForm entidade={entidade}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Membros ({members.length})</Label>
                <AddMemberForm.Trigger />
              </div>

              <AddMemberForm.Content />

              <MembersTable members={members} cargos={cargos} entidade={entidade} />
            </AddMemberForm>
          </TabsContent>

          <TabsContent value="cargos" className="flex-1 overflow-hidden flex flex-col mt-4">
            <CargoManagement entidadeId={entidade.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
