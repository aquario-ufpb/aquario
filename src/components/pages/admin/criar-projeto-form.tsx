"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Upload } from "lucide-react";
import { useUploadProjetoImage, useCreateProjeto } from "@/lib/client/hooks/use-criar-projeto";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { toast } from "sonner";

export function CriarProjetoForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  
  const uploadMutation = useUploadProjetoImage();
  const createMutation = useCreateProjeto();
  const { data: currentUser } = useCurrentUser();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)");
      return;
    }

    try {
      toast.loading("Enviando imagem...");
      const url = await uploadMutation.mutateAsync(file);
      setImageUrl(url);
      setImageName(file.name);
      toast.dismiss();
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const event = {
            target: { files: [file] },
          } as any;
          handleFileChange(event);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!currentUser) {
      toast.error("Usuário não encontrado");
      return;
    }

    // Gerar slug a partir do título
    const slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    try {
      await createMutation.mutateAsync({
        titulo,
        slug,
        subtitulo: subtitulo || undefined,
        descricao: descricao || undefined,
        textContent: null,
        tipoConteudo: "MARKDOWN",
        urlImagem: imageUrl || undefined,
        status: "RASCUNHO",
        tags: [],
        autores: [
          {
            usuarioId: currentUser.id,
            autorPrincipal: true,
          },
        ],
      });

      // Resetar form
      setTitulo("");
      setSubtitulo("");
      setDescricao("");
      setImageUrl(null);
      setImageName("");
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        {/* Imagem */}
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition mb-6"
          onClick={handleImageClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith("image/")) {
              const event = { target: { files: [file] } } as any;
              handleFileChange(event);
            }
          }}
          onPaste={handlePaste}
        >
          {imageUrl ? (
            <div className="space-y-2">
              <img
                src={imageUrl}
                alt="Projeto"
                className="h-32 w-32 rounded object-cover mx-auto"
              />
              <p className="text-sm text-muted-foreground">{imageName}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Clique para enviar ou cole a imagem</p>
              <p className="text-xs text-muted-foreground">CTRL+V funciona</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Formulário */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Nome do projeto"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="subtitulo">Subtítulo</Label>
            <Input
              id="subtitulo"
              placeholder="Descrição breve"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição detalhada do projeto (markdown)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="mt-2 min-h-[200px]"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline">Cancelar</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!titulo || createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Continuar"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}