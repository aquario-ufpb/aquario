"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function NovoItemPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    const apiKey = "c81f173398e03313a2037d827b771e5c"; // Chave da API do ImgBB

    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          uploadedUrls.push(result.data.url);
        } else {
          throw new Error("Falha no upload da imagem: " + result.error.message);
        }
      } catch (err) {
        console.error(err);
        throw new Error("Ocorreu um erro durante o upload das imagens.");
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const urlsFotos = await uploadImages();

      const response = await fetch("http://localhost:3001/achados-e-perdidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, descricao, urlsFotos }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao reportar item");
      }

      router.push("/tadea");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 pt-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-4xl font-bold">Reportar Item Perdido</h1>
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-lg">
            Título
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Garrafa de água preta"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-lg">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o item, onde foi visto pela última vez, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fotos" className="text-lg">
            Fotos
          </Label>
          <Input id="fotos" type="file" multiple onChange={handleFileChange} />
          <p className="text-sm text-muted-foreground">
            Adicione uma ou mais fotos do item, se tiver.
          </p>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Reportar Item"}
        </Button>
      </form>
    </main>
  );
}
