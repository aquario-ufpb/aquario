"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authService } from "@/lib/api/auth";

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleResendVerification = async () => {
    if (!token) {
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      await authService.resendVerification(token);
      setResendMessage("Email de verificação reenviado! Verifique sua caixa de entrada.");
    } catch (err) {
      if (err instanceof Error) {
        setResendMessage(`Erro: ${err.message}`);
      } else {
        setResendMessage("Erro ao reenviar email de verificação");
      }
    } finally {
      setIsResending(false);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    const initials = names.map(n => n[0]).join("");
    return initials.toUpperCase().slice(0, 2);
  };

  if (isLoading || !user) {
    return (
      <div className="container mx-auto max-w-4xl p-4 pt-24">
        <Card className="p-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl p-4 pt-24">
      <Card>
        <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/50">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.urlFotoPerfil || ""} alt={user.nome} />
            <AvatarFallback className="text-3xl">{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{user.nome}</CardTitle>
          <CardDescription className="text-lg">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Centro</span>
              <span className="text-lg font-medium">
                {user.centro.sigla} - {user.centro.nome}
              </span>
            </div>
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Curso</span>
              <span className="text-lg font-medium">{user.curso.nome}</span>
            </div>
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">
                Status de Verificação
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">
                  {user.eVerificado ? "Verificado" : "Não verificado"}
                </span>
                {user.eVerificado ? (
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>
            </div>
            {user.papelPlataforma === "MASTER_ADMIN" && (
              <div className="flex flex-col space-y-1 rounded-lg border p-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Papel na Plataforma
                </span>
                <span className="text-lg font-medium">Administrador</span>
              </div>
            )}
          </div>

          {!user.eVerificado && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                Seu email ainda não foi verificado. Verifique sua caixa de entrada ou reenvie o
                email de verificação.
              </p>
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                variant="outline"
                size="sm"
              >
                {isResending ? "Enviando..." : "Reenviar email de verificação"}
              </Button>
              {resendMessage && (
                <p
                  className={`text-xs mt-2 ${resendMessage.includes("Erro") ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                >
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          {user.papelPlataforma === "MASTER_ADMIN" && (
            <div className="mt-4">
              <Link href="/admin">
                <Button className="w-full">Painel de Administração</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
