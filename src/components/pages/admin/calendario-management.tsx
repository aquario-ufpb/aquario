"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Info,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useSemestres,
  useCreateSemestre,
  useUpdateSemestre,
  useDeleteSemestre,
  useCreateEvento,
  useBatchCreateEventos,
  useUpdateEvento,
  useDeleteEvento,
  useSemestre,
} from "@/lib/client/hooks/use-calendario-academico";
import {
  CATEGORIA_LABELS,
  CATEGORIA_COLORS,
  ALL_CATEGORIAS,
  parseCalendarioCsv,
  extractSemestreInfo,
  type CsvEventRow,
} from "@/lib/shared/config/calendario-academico";
import type { CategoriaEvento, SemestreLetivo } from "@/lib/shared/types/calendario.types";
import { toast } from "sonner";

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDateForInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function formatDateObjForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSemestreStatus(semestre: SemestreLetivo): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  const now = new Date();
  const inicio = new Date(semestre.dataInicio);
  const fim = new Date(semestre.dataFim);

  if (now >= inicio && now <= fim) {
    return { label: "Ativo", variant: "default" as const };
  }
  if (now < inicio) {
    return { label: "Futuro", variant: "secondary" as const };
  }
  return { label: "Passado", variant: "outline" as const };
}

function getCategoriaBadgeClasses(color: string): string {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rose: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    slate: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  };
  return map[color] || map.slate;
}

// =============================================================================
// Main Component
// =============================================================================

type CsvImportData = {
  events: CsvEventRow[];
  nome: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
};

export function CalendarioManagement() {
  const [selectedSemestreId, setSelectedSemestreId] = useState<string | null>(null);
  const [csvImportData, setCsvImportData] = useState<CsvImportData | null>(null);

  if (csvImportData) {
    return (
      <CsvImportFlow
        data={csvImportData}
        onCancel={() => setCsvImportData(null)}
        onSuccess={semestreId => {
          setCsvImportData(null);
          setSelectedSemestreId(semestreId);
        }}
      />
    );
  }

  if (selectedSemestreId) {
    return (
      <EventosManagement
        semestreId={selectedSemestreId}
        onBack={() => setSelectedSemestreId(null)}
      />
    );
  }

  return (
    <SemestresManagement onSelectSemestre={setSelectedSemestreId} onCsvImport={setCsvImportData} />
  );
}

// =============================================================================
// Semesters Management
// =============================================================================

function SemestresManagement({
  onSelectSemestre,
  onCsvImport,
}: {
  onSelectSemestre: (id: string) => void;
  onCsvImport: (data: CsvImportData) => void;
}) {
  const { data: semestres, isLoading } = useSemestres();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSemestre, setEditingSemestre] = useState<SemestreLetivo | null>(null);

  const handleCsvParsed = useCallback(
    (events: CsvEventRow[]) => {
      const info = extractSemestreInfo(events);
      onCsvImport({
        events,
        nome: info.nome,
        dataInicio: info.dataInicio,
        dataFim: info.dataFim,
      });
    },
    [onCsvImport]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Semestres Letivos</h2>
        <div className="flex gap-2">
          <CsvUploadButton onParsed={handleCsvParsed} label="Importar CSV" />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Novo Semestre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Semestre</DialogTitle>
              </DialogHeader>
              <SemestreForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!semestres?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Nenhum semestre cadastrado. Importe um CSV para começar.
            </p>
            <CsvUploadButton onParsed={handleCsvParsed} label="Importar CSV" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {semestres.map(semestre => {
            const status = getSemestreStatus(semestre);
            return (
              <Card
                key={semestre.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectSemestre(semestre.id)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{semestre.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(semestre.dataInicio)} - {formatDate(semestre.dataFim)}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingSemestre(semestre);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <DeleteSemestreButton semestreId={semestre.id} semestreNome={semestre.nome} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingSemestre} onOpenChange={open => !open && setEditingSemestre(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Semestre</DialogTitle>
          </DialogHeader>
          {editingSemestre && (
            <SemestreForm semestre={editingSemestre} onSuccess={() => setEditingSemestre(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// CSV Import Flow (creates semester + imports events in one step)
// =============================================================================

function CsvImportFlow({
  data,
  onCancel,
  onSuccess,
}: {
  data: CsvImportData;
  onCancel: () => void;
  onSuccess: (semestreId: string) => void;
}) {
  const [nome, setNome] = useState(data.nome || "");
  const [dataInicio, setDataInicio] = useState(
    data.dataInicio ? formatDateObjForInput(data.dataInicio) : ""
  );
  const [dataFim, setDataFim] = useState(data.dataFim ? formatDateObjForInput(data.dataFim) : "");
  const [editableEvents, setEditableEvents] = useState(data.events);

  const createSemestreMutation = useCreateSemestre();
  const batchCreateMutation = useBatchCreateEventos();
  const isPending = createSemestreMutation.isPending || batchCreateMutation.isPending;

  const handleCategoriaChange = (index: number, categoria: CategoriaEvento) => {
    setEditableEvents(prev =>
      prev.map((event, i) => (i === index ? { ...event, categoria } : event))
    );
  };

  const handleRemoveEvent = (index: number) => {
    setEditableEvents(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!nome || !dataInicio || !dataFim) {
      toast.error("Preencha o nome e as datas do semestre");
      return;
    }

    try {
      // Step 1: Create semester
      const semestre = await createSemestreMutation.mutateAsync({
        nome,
        dataInicio,
        dataFim,
      });

      // Step 2: Batch import events
      await batchCreateMutation.mutateAsync({
        semestreId: semestre.id,
        data: {
          eventos: editableEvents.map(e => ({
            descricao: e.descricao,
            dataInicio: e.dataInicio.toISOString(),
            dataFim: e.dataFim.toISOString(),
            categoria: e.categoria,
          })),
          replace: false,
        },
      });

      toast.success(`Semestre "${nome}" criado com ${editableEvents.length} eventos`);
      onSuccess(semestre.id);
    } catch {
      toast.error("Erro ao importar calendário");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Importar Calendário</h2>
          <p className="text-sm text-muted-foreground">
            {editableEvents.length} eventos encontrados. Revise os dados antes de importar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={isPending || !nome || !dataInicio || !dataFim}>
            {isPending ? "Importando..." : "Criar Semestre e Importar"}
          </Button>
        </div>
      </div>

      {/* Semester info - auto-detected, editable */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="csv-nome">Nome do Semestre</Label>
              <Input
                id="csv-nome"
                placeholder="Ex: 2025.1"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csv-inicio">Início do Período Letivo</Label>
              <Input
                id="csv-inicio"
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csv-fim">Término do Período Letivo</Label>
              <Input
                id="csv-fim"
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
              />
            </div>
          </div>
          {data.nome && (
            <p className="text-xs text-muted-foreground mt-2">
              Detectado automaticamente do CSV. Ajuste se necessário.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Events list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {editableEvents.map((event, index) => (
          <Card key={index}>
            <CardContent className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{event.descricao}</div>
                <div className="text-xs text-muted-foreground">
                  {event.dataInicio.toLocaleDateString("pt-BR")} -{" "}
                  {event.dataFim.toLocaleDateString("pt-BR")}
                </div>
              </div>
              <Select
                value={event.categoria}
                onValueChange={v => handleCategoriaChange(index, v as CategoriaEvento)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIA_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemoveEvent(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Semester Form
// =============================================================================

function SemestreForm({
  semestre,
  onSuccess,
}: {
  semestre?: SemestreLetivo;
  onSuccess: () => void;
}) {
  const createMutation = useCreateSemestre();
  const updateMutation = useUpdateSemestre();
  const isEditing = !!semestre;

  const [nome, setNome] = useState(semestre?.nome || "");
  const [dataInicio, setDataInicio] = useState(
    semestre ? formatDateForInput(semestre.dataInicio) : ""
  );
  const [dataFim, setDataFim] = useState(semestre ? formatDateForInput(semestre.dataFim) : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: semestre.id,
          data: { nome, dataInicio, dataFim },
        });
        toast.success("Semestre atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({ nome, dataInicio, dataFim });
        toast.success("Semestre criado com sucesso");
      }
      onSuccess();
    } catch {
      toast.error(isEditing ? "Erro ao atualizar semestre" : "Erro ao criar semestre");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          placeholder="Ex: 2025.1"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data de Início</Label>
          <Input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data de Fim</Label>
          <Input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
      </Button>
    </form>
  );
}

// =============================================================================
// Delete Semester Button
// =============================================================================

function DeleteSemestreButton({
  semestreId,
  semestreNome,
}: {
  semestreId: string;
  semestreNome: string;
}) {
  const deleteMutation = useDeleteSemestre();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(semestreId);
      toast.success("Semestre removido com sucesso");
    } catch {
      toast.error("Erro ao remover semestre");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={e => e.stopPropagation()}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={e => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover semestre?</AlertDialogTitle>
          <AlertDialogDescription>
            O semestre &quot;{semestreNome}&quot; e todos os seus eventos serão removidos
            permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// =============================================================================
// Events Management (for an existing semester)
// =============================================================================

function EventosManagement({ semestreId, onBack }: { semestreId: string; onBack: () => void }) {
  const { data: semestre, isLoading } = useSemestre(semestreId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<{
    id: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    categoria: CategoriaEvento;
  } | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvEventRow[] | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!semestre) {
    return <div className="text-center py-8 text-muted-foreground">Semestre não encontrado.</div>;
  }

  if (csvPreview) {
    return (
      <CsvEventPreview
        semestreId={semestreId}
        events={csvPreview}
        onCancel={() => setCsvPreview(null)}
        onSuccess={() => setCsvPreview(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{semestre.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(semestre.dataInicio)} - {formatDate(semestre.dataFim)} &middot;{" "}
            {semestre.eventos.length} eventos
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Evento</DialogTitle>
            </DialogHeader>
            <EventoForm semestreId={semestreId} onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>

        <CsvUploadButton onParsed={setCsvPreview} label="Importar CSV" />
      </div>

      {!semestre.eventos.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum evento cadastrado. Adicione eventos manualmente ou importe um CSV.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {semestre.eventos.map(evento => (
            <Card key={evento.id}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{evento.descricao}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(evento.dataInicio)} - {formatDate(evento.dataFim)}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getCategoriaBadgeClasses(CATEGORIA_COLORS[evento.categoria])}`}
                >
                  {CATEGORIA_LABELS[evento.categoria]}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingEvento({
                        id: evento.id,
                        descricao: evento.descricao,
                        dataInicio: evento.dataInicio,
                        dataFim: evento.dataFim,
                        categoria: evento.categoria,
                      })
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <DeleteEventoButton semestreId={semestreId} eventoId={evento.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingEvento} onOpenChange={open => !open && setEditingEvento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          {editingEvento && (
            <EventoForm
              semestreId={semestreId}
              evento={editingEvento}
              onSuccess={() => setEditingEvento(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Event Form
// =============================================================================

function EventoForm({
  semestreId,
  evento,
  onSuccess,
}: {
  semestreId: string;
  evento?: {
    id: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    categoria: CategoriaEvento;
  };
  onSuccess: () => void;
}) {
  const createMutation = useCreateEvento();
  const updateMutation = useUpdateEvento();
  const isEditing = !!evento;

  const [descricao, setDescricao] = useState(evento?.descricao || "");
  const [dataInicio, setDataInicio] = useState(evento ? formatDateForInput(evento.dataInicio) : "");
  const [dataFim, setDataFim] = useState(evento ? formatDateForInput(evento.dataFim) : "");
  const [categoria, setCategoria] = useState<CategoriaEvento>(evento?.categoria || "OUTRA");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          semestreId,
          eventoId: evento.id,
          data: { descricao, dataInicio, dataFim, categoria },
        });
        toast.success("Evento atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          semestreId,
          data: { descricao, dataInicio, dataFim, categoria },
        });
        toast.success("Evento criado com sucesso");
      }
      onSuccess();
    } catch {
      toast.error(isEditing ? "Erro ao atualizar evento" : "Erro ao criar evento");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          placeholder="Descrição do evento"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventoDataInicio">Data de Início</Label>
          <Input
            id="eventoDataInicio"
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventoDataFim">Data de Fim</Label>
          <Input
            id="eventoDataFim"
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Select value={categoria} onValueChange={v => setCategoria(v as CategoriaEvento)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIAS.map(cat => (
              <SelectItem key={cat} value={cat}>
                {CATEGORIA_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Adicionar"}
      </Button>
    </form>
  );
}

// =============================================================================
// Delete Event Button
// =============================================================================

function DeleteEventoButton({ semestreId, eventoId }: { semestreId: string; eventoId: string }) {
  const deleteMutation = useDeleteEvento();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ semestreId, eventoId });
      toast.success("Evento removido");
    } catch {
      toast.error("Erro ao remover evento");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover evento?</AlertDialogTitle>
          <AlertDialogDescription>
            Este evento será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// =============================================================================
// CSV Upload Button (reusable)
// =============================================================================

function CsvUploadButton({
  onParsed,
  label,
}: {
  onParsed: (events: CsvEventRow[]) => void;
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const events = parseCalendarioCsv(text);

        if (events.length === 0) {
          toast.error("Nenhum evento encontrado no CSV");
          return;
        }

        onParsed(events);
      } catch {
        toast.error("Erro ao processar arquivo CSV");
      }

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onParsed]
  );

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm" side="bottom">
          <p className="font-medium mb-2">Formato esperado do CSV</p>
          <p className="text-muted-foreground mb-2">
            O arquivo deve ter uma linha de cabeçalho e usar um destes formatos:
          </p>
          <div className="space-y-1 text-xs font-mono bg-muted p-2 rounded">
            <p>Event,Start Date,End Date</p>
            <p className="text-muted-foreground">ou</p>
            <p>Event,Date,Start Date,End Date</p>
          </div>
          <p className="text-muted-foreground mt-2">
            Datas no formato <span className="font-mono">DD/MM/YYYY</span>. O nome do semestre e as
            datas de início/fim são detectados automaticamente a partir dos eventos
            &quot;INÍCIO/TÉRMINO DO PERÍODO LETIVO&quot;.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// =============================================================================
// CSV Event Preview (for adding events to existing semester)
// =============================================================================

function CsvEventPreview({
  semestreId,
  events,
  onCancel,
  onSuccess,
}: {
  semestreId: string;
  events: CsvEventRow[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [editableEvents, setEditableEvents] = useState(events);
  const [replace, setReplace] = useState(true);
  const batchMutation = useBatchCreateEventos();

  const handleCategoriaChange = (index: number, categoria: CategoriaEvento) => {
    setEditableEvents(prev =>
      prev.map((event, i) => (i === index ? { ...event, categoria } : event))
    );
  };

  const handleImport = async () => {
    try {
      await batchMutation.mutateAsync({
        semestreId,
        data: {
          eventos: editableEvents.map(e => ({
            descricao: e.descricao,
            dataInicio: e.dataInicio.toISOString(),
            dataFim: e.dataFim.toISOString(),
            categoria: e.categoria,
          })),
          replace,
        },
      });
      toast.success(`${editableEvents.length} eventos importados com sucesso`);
      onSuccess();
    } catch {
      toast.error("Erro ao importar eventos");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pré-visualização do CSV</h2>
          <p className="text-sm text-muted-foreground">
            {editableEvents.length} eventos encontrados. Revise as categorias antes de importar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={batchMutation.isPending}>
            {batchMutation.isPending ? "Importando..." : "Importar"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="replace"
          checked={replace}
          onChange={e => setReplace(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="replace" className="text-sm">
          Substituir eventos existentes
        </Label>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {editableEvents.map((event, index) => (
          <Card key={index}>
            <CardContent className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{event.descricao}</div>
                <div className="text-xs text-muted-foreground">
                  {event.dataInicio.toLocaleDateString("pt-BR")} -{" "}
                  {event.dataFim.toLocaleDateString("pt-BR")}
                </div>
              </div>
              <Select
                value={event.categoria}
                onValueChange={v => handleCategoriaChange(index, v as CategoriaEvento)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIA_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
