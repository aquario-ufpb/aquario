"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LoginPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

/**
 * Shared "you need to be logged in" dialog. Shows two stacked, full-width
 * actions: log in (primary) and register (outline). Use this anywhere a
 * gated action is triggered by an unauthenticated user.
 */
export function LoginPromptDialog({
  open,
  onOpenChange,
  title = "Faça login para continuar",
  description = "Você precisa estar logado para realizar essa ação.",
}: LoginPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-aquario-primary/10 text-aquario-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            asChild
            className="w-full rounded-full bg-aquario-primary text-white hover:bg-aquario-primary/90"
            size="lg"
          >
            <Link href="/login">Fazer login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full" size="lg">
            <Link href="/registro">Criar conta</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
