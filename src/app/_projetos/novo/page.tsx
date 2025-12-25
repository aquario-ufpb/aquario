"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Tiptap from "@/components/shared/tiptap";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/client/utils";

export default function NovoProjetoPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [selectedMembros, setSelectedMembros] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const isLoading = isAuthLoading || userLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/projetos");
    }

    const fetchUsuarios = async () => {
      try {
        const response = await fetch("http://localhost:3001/usuarios");
        if (!response.ok) {
          throw new Error("Falha ao buscar usuários");
        }
        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsuarios();
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/projetos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo: "PESSOAL",
          tags: tags.split(",").map(tag => tag.trim()),
          coordenadorId: user?.id,
          centroId: user?.centro.id,
          membroIds: selectedMembros,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao criar o projeto");
      }

      router.push("/projetos");
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

  if (isAuthLoading || !user) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 pt-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-4xl font-bold">Divulgar Novo Projeto</h1>
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-lg">
            Título do Projeto
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Aquário - O Hub de Oportunidades do CI"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-lg">
            Tags (separadas por vírgula)
          </Label>
          <Input
            id="tags"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Ex: React, Node.js, IA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-lg">
            Descrição
          </Label>
          <Tiptap value={descricao} onChange={setDescricao} />
        </div>

        <div className="space-y-2">
          <Label className="text-lg">Membros</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedMembros.length > 0
                  ? `${selectedMembros.length} membro(s) selecionado(s)`
                  : "Selecione os membros..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar membro..." />
                <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                <CommandGroup>
                  {usuarios.map(usuario => (
                    <CommandItem
                      key={usuario.id}
                      onSelect={() => {
                        const isSelected = selectedMembros.includes(usuario.id);
                        if (isSelected) {
                          setSelectedMembros(selectedMembros.filter(id => id !== usuario.id));
                        } else {
                          setSelectedMembros([...selectedMembros, usuario.id]);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMembros.includes(usuario.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {usuario.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Publicando..." : "Publicar Projeto"}
        </Button>
      </form>
    </main>
  );
}
