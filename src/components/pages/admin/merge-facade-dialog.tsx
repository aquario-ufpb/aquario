"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMergeFacadeUser } from "@/lib/client/hooks/use-usuarios";

type User = {
  id: string;
  nome: string;
  email: string | null;
  eFacade?: boolean;
};

type MergeFacadeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facadeUserId: string | null;
  facadeUserName: string;
  availableUsers: User[];
};

export function MergeFacadeDialog({
  open,
  onOpenChange,
  facadeUserId,
  facadeUserName,
  availableUsers,
}: MergeFacadeDialogProps) {
  const [realUserId, setRealUserId] = useState("");
  const [deleteFacade, setDeleteFacade] = useState(true);

  const mergeFacadeUserMutation = useMergeFacadeUser();

  const handleMerge = async () => {
    if (!facadeUserId || !realUserId) {
      toast.error("Selecione o usuário real para mesclar");
      return;
    }

    if (facadeUserId === realUserId) {
      toast.error("Não é possível mesclar um usuário com ele mesmo");
      return;
    }

    try {
      const result = await mergeFacadeUserMutation.mutateAsync({
        facadeUserId,
        realUserId,
        deleteFacade,
      });

      toast.success("Usuário facade mesclado", {
        description: `${result.membershipsCopied} membros copiados. ${
          result.conflicts > 0 ? `${result.conflicts} conflitos ignorados. ` : ""
        }${result.facadeUserDeleted ? "Usuário facade deletado." : "Usuário facade mantido."}`,
      });

      onOpenChange(false);
      setRealUserId("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao mesclar usuário facade";
      toast.error("Erro ao mesclar usuário facade", {
        description: errorMessage,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setRealUserId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mesclar Usuário Facade</DialogTitle>
          <DialogDescription>
            Mescle as membros do usuário facade em um usuário real. Os membros conflitantes serão
            ignorados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="merge-facade-user">Usuário Facade</Label>
            <Input id="merge-facade-user" value={facadeUserName} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="merge-real-user">Usuário Real *</Label>
            <Select value={realUserId} onValueChange={setRealUserId}>
              <SelectTrigger id="merge-real-user">
                <SelectValue placeholder="Selecione o usuário real" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter(u => !u.eFacade && u.id !== facadeUserId)
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome} {user.email ? `(${user.email})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="merge-delete-facade"
              checked={deleteFacade}
              onCheckedChange={checked => setDeleteFacade(checked === true)}
            />
            <Label htmlFor="merge-delete-facade" className="text-sm font-normal cursor-pointer">
              Deletar usuário facade após mesclar
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={mergeFacadeUserMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={mergeFacadeUserMutation.isPending || !realUserId}>
            {mergeFacadeUserMutation.isPending ? "Mesclando..." : "Mesclar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
