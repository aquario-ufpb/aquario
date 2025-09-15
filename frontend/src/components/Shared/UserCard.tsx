import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface Curso {
  nome: string;
}

export interface User {
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
  curso?: Curso | null;
  periodo?: number | null;
}

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="flex flex-col items-center text-center p-6">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={user.urlFotoPerfil || ''} alt={user.nome} />
          <AvatarFallback>{user.nome.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold truncate w-full">{user.nome}</h3>
        {user.curso && <p className="text-sm text-muted-foreground truncate w-full">{user.curso.nome}</p>}
      </CardContent>
    </Card>
  );
};

export default UserCard;
