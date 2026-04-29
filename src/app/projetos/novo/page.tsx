"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { useCurrentUser, useMyMemberships, useSearchUsers } from "@/lib/client/hooks/use-usuarios";
import { mapImagePath } from "@/lib/client/api/entidades";
import { ImageIcon, Search, X } from "lucide-react";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { Badge } from "@/components/ui/badge";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Limits aligned with the server-side Zod schema in
// src/lib/shared/validations/projeto.ts
const MAX_TITULO_LEN = 255;
const MAX_SUBTITULO_LEN = 500;
const MAX_TEXT_CONTENT_LEN = 50_000;

const POSTAR_COMO_USUARIO = "__usuario__";

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

export default function NovoProjetoPage() {
  const router = useRouter();
  const { data: usuario, isLoading: isLoadingUser } = useCurrentUser();
  const { data: memberships = [] } = useMyMemberships();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [urlRepositorio, setUrlRepositorio] = useState("");
  const [urlDemo, setUrlDemo] = useState("");
  const [urlOutro, setUrlOutro] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // "Postando como" — selected entidade id, or POSTAR_COMO_USUARIO when posting
  // as the personal profile.
  const [postandoComo, setPostandoComo] = useState<string>(POSTAR_COMO_USUARIO);

  // Co-autores
  const [coAutores, setCoAutores] = useState<Array<{ id: string; nome: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResponse } = useSearchUsers(searchQuery, 10);
  const users = searchResponse?.users || [];

  // Track all uploaded blobs for this session so we can delete them if cancelled
  const [uploadedBlobs, setUploadedBlobs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoadingUser && !usuario) {
      toast.error("Ops, você não está logado! Por isso não pode acessar aqui");
      router.push("/");
    }
  }, [isLoadingUser, usuario, router]);

  // Entidades the user is an active ADMIN of — these are the "post as" options
  // beyond the personal profile.
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
    if (uploadedBlobs.length > 0) {
      toast.info("Limpando arquivos temporários...");
      await Promise.all(uploadedBlobs.map(url => deleteBlob(url)));
    }
    router.back();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    setIsUploadingCover(true);
    const toastId = toast.loading("Fazendo upload da capa...");

    if (coverImageUrl) {
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
      formData.append("file", file);

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

  const generateSlug = (text: string) => {
    return (
      text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`
    );
  };

  const isOverLimit =
    titulo.length > MAX_TITULO_LEN ||
    subtitulo.length > MAX_SUBTITULO_LEN ||
    markdownContent.length > MAX_TEXT_CONTENT_LEN;

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

    setIsSaving(true);
    const toastId = toast.loading("Salvando projeto...");

    try {
      const slug = generateSlug(titulo);
      const postandoComoEntidade = postandoComo !== POSTAR_COMO_USUARIO;

      // Build the autores list. The "publicador" (autorPrincipal) depends on
      // whether the user picked their personal profile or one of their entidades.
      const autoresList: Array<{
        usuarioId?: string;
        entidadeId?: string;
        autorPrincipal: boolean;
      }> = postandoComoEntidade
        ? [
            { entidadeId: postandoComo, autorPrincipal: true },
            { usuarioId: usuario.id, autorPrincipal: false },
          ]
        : [{ usuarioId: usuario.id, autorPrincipal: true }];

      for (const co of coAutores) {
        autoresList.push({ usuarioId: co.id, autorPrincipal: false });
      }

      const body = {
        titulo,
        slug,
        subtitulo: subtitulo || null,
        descricao: subtitulo || null, // Using subtitle as short desc for now
        textContent: markdownContent,
        urlImagem: coverImageUrl,
        status: "PUBLICADO",
        urlRepositorio: urlRepositorio || null,
        urlDemo: urlDemo || null,
        urlOutro: urlOutro || null,
        autores: autoresList,
      };

      const res = await apiClient("/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        await throwApiError(res);
      }

      toast.success("Projeto criado com sucesso!", { id: toastId });
      setUploadedBlobs([]);
      router.push("/projetos");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao salvar projeto.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingUser) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!usuario) {
    return (
      <div className="p-8 text-center text-red-500">
        Ops, você não está logado! Por isso não pode acessar aqui
      </div>
    );
  }

  const userAvatarUrl = usuario.urlFotoPerfil || getDefaultAvatarUrl(usuario.id, usuario.nome);
  const selectedEntidade = adminEntidades.find(e => e.id === postandoComo);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-24 max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Novo Projeto</h1>
        <p className="text-muted-foreground">
          Compartilhe um projeto com a comunidade do Centro de Informática.
        </p>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN COLUMN — cover, title, subtitle, body editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Imagem de Capa */}
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
                  className={`relative w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isUploadingCover ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                  />
                </div>
              </div>

              {/* Título e Subtítulo (stacked) */}
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

            {/* RIGHT COLUMN — postando como, links, co-autores */}
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

              {/* Links Externos */}
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
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery.trim() && users.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto bg-background p-1 space-y-1 shadow-sm">
                      {users.map(u => {
                        if (u.id === usuario?.id) {
                          return null;
                        }
                        const isAlreadyAdded = coAutores.some(a => a.id === u.id);
                        return (
                          <div
                            key={u.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              isAlreadyAdded
                                ? "bg-muted"
                                : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                            onClick={() => {
                              if (!isAlreadyAdded) {
                                setCoAutores(prev => [...prev, { id: u.id, nome: u.nome }]);
                                setSearchQuery("");
                              }
                            }}
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border">
                              <Image
                                src={
                                  u.urlFotoPerfil || getDefaultAvatarUrl(u.id, u.nome, u.eFacade)
                                }
                                alt={u.nome}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            {isAlreadyAdded && (
                              <Badge variant="secondary" className="text-[10px]">
                                Adicionado
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {searchQuery.trim() && users.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum usuário encontrado.</p>
                  )}

                  {coAutores.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {coAutores.map(a => (
                        <Badge
                          key={a.id}
                          variant="secondary"
                          className="flex items-center gap-1 pl-2 pr-1 py-1"
                        >
                          <span className="text-xs">{a.nome}</span>
                          <button
                            type="button"
                            onClick={() => setCoAutores(prev => prev.filter(p => p.id !== a.id))}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editor de Texto — full width below the two columns */}
          <div className="space-y-1.5 mt-6 pt-6 border-t">
            <Label>Corpo do Projeto</Label>
            <div className="border border-input rounded-md overflow-hidden bg-background">
              <Tiptap
                value={markdownContent}
                onChange={setMarkdownContent}
                onImageUpload={registerBlob}
              />
            </div>
            <CharCount length={markdownContent.length} max={MAX_TEXT_CONTENT_LEN} />
          </div>

          {/* Footer / Ações */}
          <div className="flex items-center justify-between border-t pt-6 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isOverLimit}
              className="bg-aquario-primary text-white hover:bg-aquario-primary/90"
            >
              {isSaving ? "Salvando..." : "Continuar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
