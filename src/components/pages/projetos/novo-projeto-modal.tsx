"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Tiptap from "@/components/shared/tiptap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCurrentUser, useSearchUsers } from "@/lib/client/hooks/use-usuarios";
import { ImageIcon, Search, X } from "lucide-react";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { Badge } from "@/components/ui/badge";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type NovoProjetoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function NovoProjetoModal({ open, onOpenChange, onSuccess }: NovoProjetoModalProps) {
  const router = useRouter();
  const { data: usuario, isLoading: isLoadingUser } = useCurrentUser();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [urlRepositorio, setUrlRepositorio] = useState("");
  const [urlDemo, setUrlDemo] = useState("");
  const [urlOutro, setUrlOutro] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Co-autores
  const [coAutores, setCoAutores] = useState<Array<{ id: string; nome: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResponse } = useSearchUsers(searchQuery, 10);
  const users = searchResponse?.users || [];

  // Track all uploaded blobs for this session so we can delete them if cancelled
  const [uploadedBlobs, setUploadedBlobs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetForm = () => {
    setTitulo("");
    setSubtitulo("");
    setUrlRepositorio("");
    setUrlDemo("");
    setUrlOutro("");
    setCoverImageUrl(null);
    setMarkdownContent("");
    setCoAutores([]);
    setSearchQuery("");
    setUploadedBlobs([]);
  };

  const handleCancel = async () => {
    // Attempt to clean up all images
    if (uploadedBlobs.length > 0) {
      toast.info("Limpando arquivos temporários...");
      await Promise.all(uploadedBlobs.map(url => deleteBlob(url)));
    }
    resetForm();
    onOpenChange(false);
  };

  // If user clicks the dialog overlay to close or hits Esc, we want to run our cancel logic
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleCancel();
    } else {
      onOpenChange(true);
    }
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
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`
    );
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("O título do projeto é obrigatório.");
      return;
    }
    if (!usuario) {
      toast.error("É necessário estar autenticado.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando projeto...");

    try {
      const slug = generateSlug(titulo);

      const autoresList = [
        { usuarioId: usuario.id, autorPrincipal: true },
        ...coAutores.map(a => ({ usuarioId: a.id, autorPrincipal: false })),
      ];

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
      // Reset blobs so they aren't deleted on unmount or navigation
      setUploadedBlobs([]);
      resetForm();
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh(); // Refresh page to show the new project
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao salvar projeto.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isLoadingUser && !usuario && open) {
      toast.error("Ops, você não está logado! Por isso não pode acessar aqui");
      onOpenChange(false);
    }
  }, [isLoadingUser, usuario, open, onOpenChange]);

  if (isLoadingUser || !usuario) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha as informações necessárias para publicar seu projeto no mural.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          {/* Título e Subtítulo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Novo Sistema Escolar"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitulo">Subtítulo ou Resumo</Label>
              <Input
                id="subtitulo"
                placeholder="Um parágrafo curto sobre o projeto..."
                value={subtitulo}
                onChange={e => setSubtitulo(e.target.value)}
              />
            </div>
          </div>

          {/* Links Adicionais */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Links Externos (Opcional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="demo" className="text-xs">
                  Live Demo (Link)
                </Label>
                <Input
                  id="demo"
                  placeholder="https://meuprojeto.com"
                  value={urlDemo}
                  onChange={e => setUrlDemo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
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

          {/* Editor de Texto e Co-autores */}
          <div className="space-y-6 border-t pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Co-autores do Projeto
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar e adicionar usuários da plataforma..."
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
                    <div className="flex flex-wrap gap-2 pt-2">
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

            {/* Editor de Texto */}
            <div className="space-y-2">
              <Label>Corpo do Projeto</Label>
              <div className="border border-input rounded-md overflow-hidden bg-background">
                <Tiptap
                  value={markdownContent}
                  onChange={setMarkdownContent}
                  onImageUpload={registerBlob}
                />
              </div>
            </div>
          </div>

          {/* Footer / Ações */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Publicar Projeto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
