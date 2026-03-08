"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { PartyPopper, User, CalendarDays, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

type DoneStepProps = {
  onComplete: () => Promise<void>;
  isMutating: boolean;
};

export function DoneStep({ onComplete, isMutating }: DoneStepProps) {
  const { data: user } = useCurrentUser();
  const profileHref = user?.slug ? `/usuarios/${user.slug}` : null;

  return (
    <div className="text-center space-y-8 py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Seu perfil do Aquário está configurado. Agora você pode:
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        {profileHref && (
          <Link
            href={profileHref}
            onClick={() => void onComplete()}
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aquario-primary/10 flex-shrink-0">
              <User className="w-5 h-5 text-aquario-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Meu Perfil</p>
              <p className="text-xs text-muted-foreground">
                Veja suas entidades e informações acadêmicas
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Link>
        )}
        <Link
          href="/calendario"
          onClick={() => void onComplete()}
          className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Minhas Disciplinas</p>
            <p className="text-xs text-muted-foreground">
              Confira seu calendário e horários do semestre
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Link>
      </div>

      <Button onClick={onComplete} disabled={isMutating} size="lg" className="gap-2">
        {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fechar"}
      </Button>
    </div>
  );
}
