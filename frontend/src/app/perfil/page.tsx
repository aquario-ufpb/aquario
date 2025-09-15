'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map((n) => n[0]).join('');
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
            <AvatarImage src={user.urlFotoPerfil || ''} alt={user.nome} />
            <AvatarFallback className="text-3xl">{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{user.nome}</CardTitle>
          <CardDescription className="text-lg">{user.email}</CardDescription>
          {user.bio && <p className="mt-2 text-center text-muted-foreground">{user.bio}</p>}
        </CardHeader>
        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col space-y-1 rounded-lg border p-3">
            <span className="text-sm font-semibold text-muted-foreground">Papel</span>
            <span className="text-lg font-medium">{user.papel === 'DISCENTE' ? 'Discente' : 'Docente'}</span>
          </div>
          <div className="flex flex-col space-y-1 rounded-lg border p-3">
            <span className="text-sm font-semibold text-muted-foreground">Centro</span>
            <span className="text-lg font-medium">{user.centro.sigla} - {user.centro.nome}</span>
          </div>
          {user.papel === 'DISCENTE' && user.curso && (
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Curso</span>
              <span className="text-lg font-medium">{user.curso.nome}</span>
            </div>
          )}
          {user.papel === 'DISCENTE' && user.periodo && (
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Período</span>
              <span className="text-lg font-medium">{user.periodo}º</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}