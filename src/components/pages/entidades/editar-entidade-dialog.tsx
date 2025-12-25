"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { entidadesService, type UpdateEntidadeRequest } from "@/lib/client/api/entidades";
import { Entidade, TipoEntidade } from "@/lib/shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type EditarEntidadeDialogProps = {
  entidade: Entidade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newSlug?: string) => void;
};

const TIPO_OPTIONS: { value: TipoEntidade; label: string }[] = [
  { value: "LABORATORIO", label: "Laboratório" },
  { value: "GRUPO", label: "Grupo" },
  { value: "LIGA_ACADEMICA", label: "Liga Acadêmica" },
  { value: "CENTRO_ACADEMICO", label: "Centro Acadêmico" },
  { value: "ATLETICA", label: "Atlética" },
  { value: "EMPRESA", label: "Empresa" },
  { value: "OUTRO", label: "Outro" },
];

export function EditarEntidadeDialog({
  entidade,
  open,
  onOpenChange,
  onSuccess,
}: EditarEntidadeDialogProps) {
  const { token, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<UpdateEntidadeRequest>({
    nome: entidade.name,
    subtitle: entidade.subtitle,
    description: entidade.description,
    tipo: entidade.tipo,
    contato_email: entidade.contato_email,
    instagram: entidade.instagram,
    linkedin: entidade.linkedin,
    website: entidade.website,
    location: entidade.location,
    founding_date: entidade.founding_date,
    slug: entidade.slug,
  });

  // Reset form when entidade changes
  useEffect(() => {
    if (entidade) {
      setFormData({
        nome: entidade.name,
        subtitle: entidade.subtitle,
        description: entidade.description,
        tipo: entidade.tipo,
        contato_email: entidade.contato_email,
        instagram: entidade.instagram,
        linkedin: entidade.linkedin,
        website: entidade.website,
        location: entidade.location,
        founding_date: entidade.founding_date,
        slug: entidade.slug,
      });
    }
  }, [entidade]);

  // Check if slug is available (only if slug changed)
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === entidade.slug) {
      setSlugError(null);
      return true;
    }

    try {
      const existing = await entidadesService.getBySlug(slug);
      if (existing && existing.id !== entidade.id) {
        setSlugError("Este slug já está sendo usado por outra entidade");
        return false;
      }
      setSlugError(null);
      return true;
    } catch (_error) {
      // If there's an error checking, let backend handle validation
      setSlugError(null);
      return true;
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    setFormData({ ...formData, slug: newSlug });

    // Clear previous timeout
    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current);
    }

    // Validate slug format
    if (newSlug && !/^[a-z0-9-]+$/.test(newSlug)) {
      setSlugError("Apenas letras minúsculas, números e hífens são permitidos");
      return;
    }

    // Clear error if slug is empty or same as current
    if (!newSlug || newSlug === entidade.slug) {
      setSlugError(null);
      return;
    }

    // Check availability (debounced)
    slugCheckTimeoutRef.current = setTimeout(() => {
      checkSlugAvailability(newSlug);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAuthenticated) {
      toast.error("Você precisa estar autenticado para editar");
      return;
    }

    // Final slug validation before submitting
    if (formData.slug && formData.slug !== entidade.slug) {
      const isAvailable = await checkSlugAvailability(formData.slug);
      if (!isAvailable) {
        return;
      }
    }

    setIsSubmitting(true);
    setSlugError(null);
    try {
      await entidadesService.update(entidade.id, formData, token);
      toast.success("Entidade atualizada com sucesso!");
      // Pass the new slug if it changed
      const newSlug = formData.slug && formData.slug !== entidade.slug ? formData.slug : undefined;
      onSuccess(newSlug);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        // Check if error is about slug conflict
        if (error.message.includes("slug") || error.message.includes("já está sendo usado")) {
          setSlugError(error.message);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Falha ao atualizar entidade");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Entidade</DialogTitle>
          <DialogDescription>
            Atualize as informações da entidade. O slug é usado na URL da página.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome || ""}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={formData.subtitle || ""}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value || null })}
              placeholder="Subtítulo opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={formData.slug || ""}
              onChange={handleSlugChange}
              placeholder="exemplo-slug"
              pattern="[a-z0-9-]+"
              title="Apenas letras minúsculas, números e hífens são permitidos"
              className={slugError ? "border-red-500" : ""}
            />
            {slugError ? (
              <p className="text-xs text-red-500">{slugError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                O slug é usado na URL da página (ex: /entidade/seu-slug-aqui)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={e => setFormData({ ...formData, description: e.target.value || null })}
              rows={5}
              placeholder="Descrição da entidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={value => setFormData({ ...formData, tipo: value as TipoEntidade })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato_email">Email de Contato</Label>
            <Input
              id="contato_email"
              type="email"
              value={formData.contato_email || ""}
              onChange={e => setFormData({ ...formData, contato_email: e.target.value })}
              placeholder="contato@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram || ""}
                onChange={e => setFormData({ ...formData, instagram: e.target.value || null })}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin || ""}
                onChange={e => setFormData({ ...formData, linkedin: e.target.value || null })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ""}
              onChange={e => setFormData({ ...formData, website: e.target.value || null })}
              placeholder="https://exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={e => setFormData({ ...formData, location: e.target.value || null })}
              placeholder="Ex: Centro de Informática - UFPB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="founding_date">Data de Fundação</Label>
            <Input
              id="founding_date"
              type="date"
              value={formData.founding_date || ""}
              onChange={e => setFormData({ ...formData, founding_date: e.target.value || null })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !!slugError}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
