"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Tiptap from "@/components/shared/tiptap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import NavBar from "@/components/shared/nav-bar";
import { ImageIcon } from "lucide-react";
import { StatusProjeto, TipoConteudo } from "@prisma/client";

export default function NovoProjetoPage() {
  const router = useRouter();
  const { data: usuario, isLoading: isLoadingUser } = useCurrentUser();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [urlRepositorio, setUrlRepositorio] = useState("");
  const [urlDemo, setUrlDemo] = useState("");
  const [urlPublicacao, setUrlPublicacao] = useState(""); // Medium
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track all uploaded blobs for this session so we can delete them if cancelled
  const [uploadedBlobs, setUploadedBlobs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const registerBlob = (url: string) => {
    setUploadedBlobs(prev => [...prev, url]);
  };

  const deleteBlob = async (url: string) => {
    try {
      await fetch(`/api/upload/projeto-image?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to delete blob", url, e);
    }
  };

  const handleCancel = async () => {
    // Attempt to clean up all images
    if (uploadedBlobs.length > 0) {
      toast.info("Limpando arquivos temporários...");
      await Promise.all(uploadedBlobs.map(url => deleteBlob(url)));
    }
    router.back();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    const toastId = toast.loading("Fazendo upload da capa...");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/projeto-image", {
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
    } catch (error) {
      toast.error("Erro ao enviar imagem de capa.", { id: toastId });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`;
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

      const body = {
        titulo,
        slug,
        subtitulo: subtitulo || null,
        descricao: subtitulo || null, // Using subtitle as short desc for now
        textContent: markdownContent,
        tipoConteudo: TipoConteudo.HTML, // Tiptap typically generates HTML
        urlImagem: coverImageUrl,
        status: StatusProjeto.PUBLICADO, // Or RASCUNHO depending on requirements
        urlRepositorio: urlRepositorio || null,
        urlDemo: urlDemo || null,
        urlPublicacao: urlPublicacao || null,
        autores: [
          {
            usuarioId: usuario.id,
            autorPrincipal: true,
          }
        ]
      };

      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao salvar");
      }

      toast.success("Projeto criado com sucesso!", { id: toastId });
      // Reset blobs so they aren't deleted on unmount or navigation
      setUploadedBlobs([]);
      router.push("/projetos");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar projeto.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingUser) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!usuario) {
    return <div className="p-8 text-center text-red-500">Acesso negado. Faça login.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-24 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Novo Projeto</h1>
        
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-6 space-y-6">
            
            {/* Imagem de Capa */}
            <div className="space-y-3">
              <Label>Imagem de Capa do Projeto</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center overflow-hidden group"
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
                    <span className="font-medium">{isUploadingCover ? "Enviando..." : "Clique para fazer upload da capa"}</span>
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
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitulo">Subtítulo ou Resumo</Label>
                <Input 
                  id="subtitulo" 
                  placeholder="Um parágrafo curto sobre o projeto..." 
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                />
              </div>
            </div>

            {/* Links Adicionais */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Links Externos (Opcional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-xs">Repositório (GitHub)</Label>
                  <Input 
                    id="github" 
                    placeholder="https://github.com/..." 
                    value={urlRepositorio}
                    onChange={(e) => setUrlRepositorio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo" className="text-xs">Live Demo (Link)</Label>
                  <Input 
                    id="demo" 
                    placeholder="https://meuprojeto.com" 
                    value={urlDemo}
                    onChange={(e) => setUrlDemo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medium" className="text-xs">Post no Medium/Dribbble</Label>
                  <Input 
                    id="medium" 
                    placeholder="https://medium.com/..." 
                    value={urlPublicacao}
                    onChange={(e) => setUrlPublicacao(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Editor de Texto */}
            <div className="space-y-2 border-t pt-4">
              <Label>Corpo do Projeto</Label>
              <div className="border border-input rounded-md overflow-hidden bg-background">
                <Tiptap 
                  value={markdownContent} 
                  onChange={setMarkdownContent} 
                  onImageUpload={registerBlob} 
                />
              </div>
            </div>

            {/* Footer / Ações */}
            <div className="flex items-center justify-between border-t pt-6 mt-6">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Continuar"}
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
