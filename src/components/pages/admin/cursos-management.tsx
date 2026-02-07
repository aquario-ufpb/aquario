"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import {
  useCampus,
  useCreateCampus,
  useUpdateCampus,
  useDeleteCampus,
} from "@/lib/client/hooks/use-campus";
import { useCentros } from "@/lib/client/hooks/use-centros";
import {
  useCreateCentro,
  useUpdateCentro,
  useDeleteCentro,
} from "@/lib/client/hooks/use-admin-centros";
import {
  useAllCursos,
  useCreateCurso,
  useUpdateCurso,
  useDeleteCurso,
} from "@/lib/client/hooks/use-admin-cursos";
import type { Campus, Centro, Curso } from "@/lib/shared/types";

// ============================================================
// Campus Table
// ============================================================

function CampusTable() {
  const { data: campusList, isLoading } = useCampus();
  const createMutation = useCreateCampus();
  const updateMutation = useUpdateCampus();
  const deleteMutation = useDeleteCampus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [nome, setNome] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Campus | null>(null);

  const openCreate = () => {
    setEditingCampus(null);
    setNome("");
    setDialogOpen(true);
  };

  const openEdit = (campus: Campus) => {
    setEditingCampus(campus);
    setNome(campus.nome);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      if (editingCampus) {
        await updateMutation.mutateAsync({ id: editingCampus.id, data: { nome: nome.trim() } });
        toast.success("Campus atualizado");
      } else {
        await createMutation.mutateAsync({ nome: nome.trim() });
        toast.success("Campus criado");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar campus");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Campus excluído");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir campus");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Campus</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCampus ? "Editar Campus" : "Novo Campus"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="campus-nome">Nome</Label>
                <Input
                  id="campus-nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Campus I"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {editingCampus ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-right p-3 font-semibold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!campusList?.length ? (
                  <tr>
                    <td colSpan={2} className="text-center py-6 text-muted-foreground">
                      Nenhum campus cadastrado
                    </td>
                  </tr>
                ) : (
                  campusList.map(campus => (
                    <tr key={campus.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{campus.nome}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(campus)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(campus)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Excluir campus "${deleteTarget?.nome}"?`}
        description="Esta ação não pode ser desfeita. O campus será removido permanentemente."
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}

// ============================================================
// Centros Table
// ============================================================

function CentrosTable() {
  const { data: centros, isLoading } = useCentros();
  const { data: campusList } = useCampus();
  const createMutation = useCreateCentro();
  const updateMutation = useUpdateCentro();
  const deleteMutation = useDeleteCentro();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<Centro | null>(null);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [campusId, setCampusId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Centro | null>(null);

  const openCreate = () => {
    setEditingCentro(null);
    setNome("");
    setSigla("");
    setCampusId(campusList?.[0]?.id ?? "");
    setDialogOpen(true);
  };

  const openEdit = (centro: Centro) => {
    setEditingCentro(centro);
    setNome(centro.nome);
    setSigla(centro.sigla);
    setCampusId(centro.campusId);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !sigla.trim() || !campusId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingCentro) {
        await updateMutation.mutateAsync({
          id: editingCentro.id,
          data: { nome: nome.trim(), sigla: sigla.trim(), descricao: null, campusId },
        });
        toast.success("Centro atualizado");
      } else {
        await createMutation.mutateAsync({
          nome: nome.trim(),
          sigla: sigla.trim(),
          descricao: null,
          campusId,
        });
        toast.success("Centro criado");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar centro");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Centro excluído");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir centro");
    }
  };

  const getCampusNome = (id: string) => campusList?.find(c => c.id === id)?.nome ?? "-";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Centros</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCentro ? "Editar Centro" : "Novo Centro"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="centro-nome">Nome</Label>
                <Input
                  id="centro-nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Centro de Informática"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="centro-sigla">Sigla</Label>
                <Input
                  id="centro-sigla"
                  value={sigla}
                  onChange={e => setSigla(e.target.value)}
                  placeholder="Ex: CI"
                />
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campusList?.map(campus => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {editingCentro ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Sigla</th>
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">Campus</th>
                  <th className="text-right p-3 font-semibold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!centros?.length ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum centro cadastrado
                    </td>
                  </tr>
                ) : (
                  centros.map(centro => (
                    <tr key={centro.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{centro.sigla}</td>
                      <td className="p-3">{centro.nome}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {getCampusNome(centro.campusId)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(centro)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(centro)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Excluir centro "${deleteTarget?.sigla}"?`}
        description="Esta ação não pode ser desfeita. O centro será removido permanentemente."
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}

// ============================================================
// Cursos Table
// ============================================================

function CursosTable() {
  const { data: cursos, isLoading } = useAllCursos();
  const { data: centros } = useCentros();
  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();
  const deleteMutation = useDeleteCurso();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [nome, setNome] = useState("");
  const [centroId, setCentroId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Curso | null>(null);

  const openCreate = () => {
    setEditingCurso(null);
    setNome("");
    setCentroId(centros?.[0]?.id ?? "");
    setDialogOpen(true);
  };

  const openEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setNome(curso.nome);
    setCentroId(curso.centroId);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !centroId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingCurso) {
        await updateMutation.mutateAsync({
          id: editingCurso.id,
          data: { nome: nome.trim(), centroId },
        });
        toast.success("Curso atualizado");
      } else {
        await createMutation.mutateAsync({ nome: nome.trim(), centroId });
        toast.success("Curso criado");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar curso");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Curso excluído");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir curso");
    }
  };

  const getCentroSigla = (id: string) => centros?.find(c => c.id === id)?.sigla ?? "-";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Cursos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCurso ? "Editar Curso" : "Novo Curso"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="curso-nome">Nome</Label>
                <Input
                  id="curso-nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Ciência da Computação"
                />
              </div>
              <div className="space-y-2">
                <Label>Centro</Label>
                <Select value={centroId} onValueChange={setCentroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centros?.map(centro => (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.sigla} - {centro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {editingCurso ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">Centro</th>
                  <th className="text-right p-3 font-semibold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!cursos?.length ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-muted-foreground">
                      Nenhum curso cadastrado
                    </td>
                  </tr>
                ) : (
                  cursos.map(curso => (
                    <tr key={curso.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{curso.nome}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {getCentroSigla(curso.centroId)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(curso)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(curso)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Excluir curso "${deleteTarget?.nome}"?`}
        description="Esta ação não pode ser desfeita. O curso será removido permanentemente."
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export function CursosManagement() {
  return (
    <div className="space-y-6">
      <CampusTable />
      <CentrosTable />
      <CursosTable />
    </div>
  );
}
