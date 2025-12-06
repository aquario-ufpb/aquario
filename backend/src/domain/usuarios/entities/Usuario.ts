import { Entity } from '@/core/entities/Entity';

import { Centro, Curso, PapelPlataforma } from '@prisma/client';

interface UsuarioProps {
  nome: string;
  email: string;
  senhaHash: string;
  permissoes: string[];
  papelPlataforma: PapelPlataforma;
  eVerificado?: boolean;
  centro: Centro;
  curso: Curso;
  bio?: string | null;
  urlFotoPerfil?: string | null;
}

export class Usuario extends Entity<UsuarioProps> {
  get nome() {
    return this.props.nome;
  }

  get email() {
    return this.props.email;
  }

  get eVerificado() {
    return this.props.eVerificado ?? false;
  }

  static create(props: UsuarioProps, id?: string) {
    const usuario = new Usuario(props, id);
    return usuario;
  }
}
