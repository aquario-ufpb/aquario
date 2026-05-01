"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Tiptap from "@/components/shared/tiptap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useProjetoBySlug } from "@/lib/client/hooks/use-projetos";
import { useUpdateProjeto, useUpdateProjetoAutores } from "@/lib/client/hooks/use-criar-projeto";
import { canEditProjeto } from "@/lib/client/utils/projeto-permissions";
import { mapImagePath } from "@/lib/client/api/entidades";
import { CoAutoresPicker, type CoAutor } from "@/components/shared/co-autores-picker";
import { PeriodoPicker } from "@/components/shared/periodo-picker";
import { PhotoCropDialog } from "@/components/shared/photo-crop-dialog";
import { ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/client/api/api-client";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Limits aligned with the server-side Zod schema in src/lib/shared/validations/projetos.ts
const MAX_TITULO_LEN = 255;
const MAX_SUBTITULO_LEN = 500;
const MAX_TEXT_CONTENT_LEN = 50_000;

const POSTAR_COMO_USUARIO = "__usuario__";

const STATUS_OPTIONS = ["PUBLICADO", "RASCUNHO", "ARQUIVADO"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

function CharCount({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <p
      className={`text-xs text-right ${
        over ? "text-destructive font-medium" : "text-muted-foreground"
      }`}
    >
      {length.toLocaleString()} / {max.toLocaleString()}
      {over ? " — limite excedido" : ""}
    </p>
  );
}

export default function EditarProjetoPage() {
  const router = useRouter();
  const { id: slug } = useParams<{ id: string }>();
  const { data: usuario, isLoading: isLoadingUser } = useCurrentUser();
  const { data: memberships = [] } = useMyMemberships();
  const { data: projeto, isLoading: isLoadingProjeto, error } = useProjetoBySlug(slug);

  const updateProjeto = useUpdateProjeto(slug);
  const updateAutores = useUpdateProjetoAutores(slug);

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [urlRepositorio, setUrlRepositorio] = useState("");
  const [urlDemo, setUrlDemo] = useState("");
  const [urlOutro, setUrlOutro] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [textContent, setTextContent] = useState("");
  const [status, setStatus] = useState<Status>("PUBLICADO");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // "Postando como" — selected entidade id, or POSTAR_COMO_USUARIO. The principal autor.
  const [postandoComo, setPostandoComo] = useState<string>(POSTAR_COMO_USUARIO);

  // Co-autores (anyone NOT the principal — can be users and/or entidades)
  const [coAutores, setCoAutores] = useState<CoAutor[]>([]);

  // Track only NEW uploads in this session — deletable on cancel.
  const [uploadedBlobs, setUploadedBlobs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state — file picked → read locally → open crop dialog → upload blob.
  const [cropDataUrl, setCropDataUrl] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  // Snapshot of original autores so we can detect changes on save.
  const [originalAutoresKey, setOriginalAutoresKey] = useState<string>("");

  const myAdminEntidadeIds = useMemo(
    () =>
      new Set(memberships.filter(m => m.papel === "ADMIN" && !m.endedAt).map(m => m.entidade.id)),
    [memberships]
  );

  const adminEntidades = useMemo(
    () =>
      memberships
        .filter(m => m.papel === "ADMIN" && !m.endedAt)
        .map(m => ({
          id: m.entidade.id,
          nome: m.entidade.nome,
          imagePath: mapImagePath(m.entidade.urlFoto),
        })),
    [memberships]
  );
  const hasAdminEntidades = adminEntidades.length > 0;

  const canEdit = useMemo(
    () =>
      canEditProjeto(
        usuario,
        projeto?.autores.map(a => ({
          usuarioId: a.usuarioId,
          entidadeId: a.entidadeId,
          autorPrincipal: a.autorPrincipal,
        })) ?? [],
        myAdminEntidadeIds
      ),
    [usuario, projeto, myAdminEntidadeIds]
  );

  // Hydrate state from projeto once it loads. We use a state flag (not a ref)
  // so the render that gates Tiptap can react to hydration completing — Tiptap's
  // `content` prop is only consumed at editor init.
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    if (!projeto || hasHydrated) {
      return;
    }

    setTitulo(projeto.titulo);
    setSubtitulo(projeto.subtitulo ?? "");
    setUrlRepositorio(projeto.urlRepositorio ?? "");
    setUrlDemo(projeto.urlDemo ?? "");
    setUrlOutro(projeto.urlOutro ?? "");
    setCoverImageUrl(projeto.urlImagem ?? null);
    // dataInicio/dataFim arrive as ISO strings over JSON even though TS types them as Date.
    setDataInicio(projeto.dataInicio ? String(projeto.dataInicio).slice(0, 10) : "");
    setDataFim(projeto.dataFim ? String(projeto.dataFim).slice(0, 10) : "");
    setTagsInput((projeto.tags ?? []).join(", "));
    setTextContent(projeto.textContent ?? "");
    setStatus(projeto.status as Status);

    // Determine the principal autor and the co-autores
    const principal = projeto.autores.find(a => a.autorPrincipal) ?? projeto.autores[0];
    if (principal?.entidade) {
      setPostandoComo(principal.entidade.id);
    } else {
      setPostandoComo(POSTAR_COMO_USUARIO);
    }

    const principalUserId = principal?.usuario?.id;
    const principalEntidadeId = principal?.entidade?.id;

    const coAutorList: CoAutor[] = projeto.autores.flatMap(a => {
      const out: CoAutor[] = [];
      if (a.usuario && a.usuario.id !== principalUserId) {
        out.push({ kind: "user", id: a.usuario.id, nome: a.usuario.nome });
      }
      if (a.entidade && a.entidade.id !== principalEntidadeId) {
        out.push({ kind: "entidade", id: a.entidade.id, nome: a.entidade.nome });
      }
      return out;
    });
    setCoAutores(coAutorList);

    setOriginalAutoresKey(autoresKey(projeto.autores));
    setHasHydrated(true);
  }, [projeto, hasHydrated]);

  // Auth + permission gating
  useEffect(() => {
    if (!isLoadingUser && !usuario) {
      toast.error("Você precisa estar logado para editar projetos.");
      router.push(`/projetos/${slug}`);
    }
  }, [isLoadingUser, usuario, router, slug]);

  useEffect(() => {
    if (projeto && usuario && !canEdit) {
      toast.error("Você não tem permissão para editar este projeto.");
      router.push(`/projetos/${slug}`);
    }
  }, [projeto, usuario, canEdit, router, slug]);

  const registerBlob = (url: string) => {
    setUploadedBlobs(prev => [...prev, url]);
  };

  const deleteBlob = async (url: string) => {
    try {
      await apiClient(`/upload/projeto-image?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to delete blob", url, e);
    }
  };

  const handleCancel = async () => {
    // Only delete blobs uploaded *in this session* — leave original image intact.
    if (uploadedBlobs.length > 0) {
      toast.info("Limpando arquivos temporários...");
      await Promise.all(uploadedBlobs.map(url => deleteBlob(url)));
    }
    router.push(`/projetos/${slug}`);
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("A imagem selecionada é muito grande (máximo 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropDataUrl(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropDialogOpen(false);
    setCropDataUrl(null);

    setIsUploadingCover(true);
    const toastId = toast.loading("Fazendo upload da capa...");

    // If the previous cover was an in-session upload, delete it before replacing.
    if (coverImageUrl && uploadedBlobs.includes(coverImageUrl)) {
      try {
        await apiClient(`/upload/projeto-image?url=${encodeURIComponent(coverImageUrl)}`, {
          method: "DELETE",
        });
        setUploadedBlobs(prev => prev.filter(url => url !== coverImageUrl));
      } catch (err) {
        console.error("Failed to delete old cover", err);
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, `cover-${Date.now()}.jpg`);
      const response = await apiClient("/upload/projeto-image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Falha no upload");
      }
      const data = await response.json();
      setCoverImageUrl(data.url);
      registerBlob(data.url);
      toast.success("Capa enviada com sucesso!", { id: toastId });
    } catch (_error) {
      toast.error("Erro ao enviar imagem de capa.", { id: toastId });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const isOverLimit =
    titulo.length > MAX_TITULO_LEN ||
    subtitulo.length > MAX_SUBTITULO_LEN ||
    textContent.length > MAX_TEXT_CONTENT_LEN;

  const isPeriodoInvalid = !!dataInicio && !!dataFim && dataFim < dataInicio;

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("O título do projeto é obrigatório.");
      return;
    }
    if (!usuario) {
      toast.error("É necessário estar autenticado.");
      return;
    }
    if (isOverLimit) {
      toast.error("Algum campo excede o tamanho permitido. Revise os contadores.");
      return;
    }
    if (isPeriodoInvalid) {
      toast.error("A data de fim deve ser posterior à data de início.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      // 1) Update projeto fields
      const tags = tagsInput
        .split(/[,;]/)
        .map(t => t.trim())
        .filter(Boolean);

      await updateProjeto.mutateAsync({
        titulo,
        subtitulo: subtitulo || null,
        textContent: textContent || null,
        urlImagem: coverImageUrl,
        urlRepositorio: urlRepositorio || null,
        urlDemo: urlDemo || null,
        urlOutro: urlOutro || null,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        tags,
        status,
      });

      // 2) If autores changed, update them via the dedicated endpoint
      const newAutoresList = buildAutores({
        postandoComo,
        usuarioId: usuario.id,
        coAutores,
      });
      const newKey = autoresKeyFromInput(newAutoresList);
      if (newKey !== originalAutoresKey) {
        await updateAutores.mutateAsync({ autores: newAutoresList });
      }

      toast.success("Projeto atualizado com sucesso!", { id: toastId });
      setUploadedBlobs([]);
      router.push(`/projetos/${slug}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao salvar alterações.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingUser || isLoadingProjeto || (projeto && !hasHydrated)) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (error || !projeto) {
    return (
      <div className="p-8 text-center text-red-500">
        {error instanceof Error ? error.message : "Projeto não encontrado."}
      </div>
    );
  }

  if (!usuario || !canEdit) {
    return null; // already redirecting
  }

  const userAvatarUrl = usuario.urlFotoPerfil || getDefaultAvatarUrl(usuario.id, usuario.nome);
  const selectedEntidade = adminEntidades.find(e => e.id === postandoComo);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-24 max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Editar Projeto</h1>
        <p className="text-muted-foreground">
          Atualize as informações do projeto. As mudanças entram em produção imediatamente.
        </p>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover */}
              <div className="space-y-3">
                <Label>Imagem de Capa do Projeto</Label>
                <div
                  onClick={() => !isUploadingCover && fileInputRef.current?.click()}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === " ") && !isUploadingCover) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={isUploadingCover ? -1 : 0}
                  aria-label="Upload de capa do projeto"
                  className={`relative w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isUploadingCover ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {coverImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-medium">Trocar imagem</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground gap-2">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                      <span className="font-medium">
                        {isUploadingCover ? "Enviando..." : "Clique para fazer upload da capa"}
                      </span>
                      <span className="text-xs opacity-70">Recomendado: 1200x630px</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverPick}
                    disabled={isUploadingCover}
                  />
                </div>
              </div>

              {/* Title + Subtitle */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Novo Sistema Escolar"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                  />
                  <CharCount length={titulo.length} max={MAX_TITULO_LEN} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subtitulo">Subtítulo ou Resumo</Label>
                  <Input
                    id="subtitulo"
                    placeholder="Um parágrafo curto sobre o projeto..."
                    value={subtitulo}
                    onChange={e => setSubtitulo(e.target.value)}
                  />
                  <CharCount length={subtitulo.length} max={MAX_SUBTITULO_LEN} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              {/* Postando como */}
              <div className="space-y-2">
                <Label>Postando como</Label>
                {hasAdminEntidades ? (
                  <Select value={postandoComo} onValueChange={setPostandoComo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={POSTAR_COMO_USUARIO}>
                        <div className="flex items-center gap-2">
                          <div className="relative w-5 h-5 rounded-full overflow-hidden border">
                            <Image
                              src={userAvatarUrl}
                              alt={usuario.nome}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span>{usuario.nome}</span>
                        </div>
                      </SelectItem>
                      {adminEntidades.map(ent => (
                        <SelectItem key={ent.id} value={ent.id}>
                          <div className="flex items-center gap-2">
                            <div className="relative w-5 h-5 rounded-full overflow-hidden border bg-muted">
                              {ent.imagePath && (
                                <Image
                                  src={ent.imagePath}
                                  alt={ent.nome}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span>{ent.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border">
                      <Image src={userAvatarUrl} alt={usuario.nome} fill className="object-cover" />
                    </div>
                    <span className="truncate">{usuario.nome}</span>
                  </div>
                )}
                {selectedEntidade && (
                  <p className="text-xs text-muted-foreground">
                    Você é admin de {selectedEntidade.nome}.
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as Status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="ex: react, web, ai"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
              </div>

              {/* Período */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Período</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dataInicio" className="text-xs">
                      Início
                    </Label>
                    <PeriodoPicker
                      id="dataInicio"
                      value={dataInicio}
                      onChange={setDataInicio}
                      kind="start"
                      placeholder="Quando começou"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dataFim" className="text-xs">
                      Fim
                    </Label>
                    <PeriodoPicker
                      id="dataFim"
                      value={dataFim}
                      onChange={setDataFim}
                      kind="end"
                      placeholder="Em andamento"
                    />
                  </div>
                  {isPeriodoInvalid && (
                    <p className="text-xs text-destructive">
                      A data de fim deve ser posterior à data de início.
                    </p>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Links Externos</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="github" className="text-xs">
                      Repositório (GitHub)
                    </Label>
                    <Input
                      id="github"
                      placeholder="https://github.com/..."
                      value={urlRepositorio}
                      onChange={e => setUrlRepositorio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="demo" className="text-xs">
                      Live Demo
                    </Label>
                    <Input
                      id="demo"
                      placeholder="https://meuprojeto.com"
                      value={urlDemo}
                      onChange={e => setUrlDemo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outro" className="text-xs">
                      Outro link
                    </Label>
                    <Input
                      id="outro"
                      placeholder="https://..."
                      value={urlOutro}
                      onChange={e => setUrlOutro(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Co-autores */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Co-autores</h3>
                <CoAutoresPicker
                  value={coAutores}
                  onChange={setCoAutores}
                  excludeUserIds={
                    postandoComo === POSTAR_COMO_USUARIO && usuario ? [usuario.id] : []
                  }
                  excludeEntidadeIds={postandoComo !== POSTAR_COMO_USUARIO ? [postandoComo] : []}
                />
              </div>
            </div>
          </div>

          {/* Body editor — full width */}
          <div className="space-y-1.5 mt-6 pt-6 border-t">
            <Label>Corpo do Projeto</Label>
            <div className="border border-input rounded-md overflow-hidden bg-background">
              <Tiptap value={textContent} onChange={setTextContent} onImageUpload={registerBlob} />
            </div>
            <CharCount length={textContent.length} max={MAX_TEXT_CONTENT_LEN} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-6 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isOverLimit || isPeriodoInvalid}
              className="bg-aquario-primary text-white hover:bg-aquario-primary/90"
            >
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {cropDataUrl && (
        <PhotoCropDialog
          open={cropDialogOpen}
          imageUrl={cropDataUrl}
          aspect={16 / 9}
          cropShape="rect"
          title="Ajustar capa do projeto"
          description="Posicione e dê zoom na área 16:9 que será usada como capa."
          onCancel={() => {
            setCropDialogOpen(false);
            setCropDataUrl(null);
          }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

// --- helpers ---

type AutorPayload = {
  usuarioId?: string;
  entidadeId?: string;
  autorPrincipal: boolean;
};

function buildAutores({
  postandoComo,
  usuarioId,
  coAutores,
}: {
  postandoComo: string;
  usuarioId: string;
  coAutores: CoAutor[];
}): AutorPayload[] {
  // Principal is whatever "Postando como" picked. Co-autores are exactly what the
  // user has in the list — no auto-injection of the current user.
  const principal: AutorPayload =
    postandoComo === POSTAR_COMO_USUARIO
      ? { usuarioId, autorPrincipal: true }
      : { entidadeId: postandoComo, autorPrincipal: true };

  const autores: AutorPayload[] = [principal];
  for (const co of coAutores) {
    if (co.kind === "user") {
      autores.push({ usuarioId: co.id, autorPrincipal: false });
    } else {
      autores.push({ entidadeId: co.id, autorPrincipal: false });
    }
  }
  return autores;
}

/** Stable string key from existing autores (server-shape) for change detection. */
function autoresKey(
  autores: { usuarioId: string | null; entidadeId: string | null; autorPrincipal: boolean }[]
): string {
  return autores
    .map(a => `${a.entidadeId ?? ""}:${a.usuarioId ?? ""}:${a.autorPrincipal ? "1" : "0"}`)
    .sort()
    .join("|");
}

/** Same key shape from the input we'd send to PUT /autores. */
function autoresKeyFromInput(autores: AutorPayload[]): string {
  return autores
    .map(a => `${a.entidadeId ?? ""}:${a.usuarioId ?? ""}:${a.autorPrincipal ? "1" : "0"}`)
    .sort()
    .join("|");
}
