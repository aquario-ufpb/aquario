"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useCreateFacadeUser } from "@/lib/client/hooks/use-usuarios";
import { useCentros, useCursos } from "@/lib/client/hooks";

type FacadeUserDialogProps = {
  disabled?: boolean;
};

export function FacadeUserDialog({ disabled }: FacadeUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [centroId, setCentroId] = useState("");
  const [cursoId, setCursoId] = useState("");

  const createFacadeUserMutation = useCreateFacadeUser();
  const { data: centros = [] } = useCentros();
  const { data: cursos = [] } = useCursos(centroId);

  // Auto-select first centro when dialog opens and centros are available
  useEffect(() => {
    if (isOpen && centros.length > 0 && !centroId) {
      setCentroId(centros[0].id);
    }
  }, [isOpen, centros, centroId]);

  // Auto-select first curso when centro is selected and cursos are available
  useEffect(() => {
    if (centroId && cursos.length > 0 && !cursoId) {
      setCursoId(cursos[0].id);
    } else if (!centroId) {
      setCursoId("");
    }
  }, [centroId, cursos, cursoId]);

  const handleCreate = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!centroId) {
      toast.error("Centro é obrigatório");
      return;
    }
    if (!cursoId) {
      toast.error("Curso é obrigatório");
      return;
    }

    try {
      await createFacadeUserMutation.mutateAsync({
        nome: nome.trim(),
        centroId,
        cursoId,
      });
      toast.success("Usuário facade criado", {
        description: `${nome} foi criado como usuário facade.`,
      });
      setIsOpen(false);
      setNome("");
      setCentroId("");
      setCursoId("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar usuário facade";
      toast.error("Erro ao criar usuário facade", {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={disabled}>
          <UserPlus className="h-4 w-4 mr-2" />
          Criar Usuário Facade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Usuário Facade</DialogTitle>
          <DialogDescription>
            Crie um usuário facade para exibição pública. Este usuário não poderá fazer login até
            que seja mesclado com uma conta real.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="facade-nome">Nome *</Label>
            <Input
              id="facade-nome"
              placeholder="Nome do usuário"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facade-centro">Centro *</Label>
            <Select value={centroId} onValueChange={setCentroId}>
              <SelectTrigger id="facade-centro">
                <SelectValue placeholder="Selecione um centro" />
              </SelectTrigger>
              <SelectContent>
                {centros.map(centro => (
                  <SelectItem key={centro.id} value={centro.id}>
                    {centro.nome} ({centro.sigla})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facade-curso">Curso *</Label>
            <Select value={cursoId} onValueChange={setCursoId} disabled={!centroId}>
              <SelectTrigger id="facade-curso">
                <SelectValue
                  placeholder={!centroId ? "Selecione um centro primeiro" : "Selecione um curso"}
                />
              </SelectTrigger>
              <SelectContent>
                {cursos.map(curso => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={createFacadeUserMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createFacadeUserMutation.isPending || !nome || !centroId || !cursoId}
          >
            {createFacadeUserMutation.isPending ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
