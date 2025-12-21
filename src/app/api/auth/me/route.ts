import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";

export function GET(request: Request) {
  return withAuth(request, (_req, usuario) => {
    // Return user data without sensitive fields
    return Promise.resolve(
      NextResponse.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papelPlataforma: usuario.papelPlataforma,
        eVerificado: usuario.eVerificado,
        urlFotoPerfil: usuario.urlFotoPerfil,
        centro: {
          id: usuario.centro.id,
          nome: usuario.centro.nome,
          sigla: usuario.centro.sigla,
        },
        curso: {
          id: usuario.curso.id,
          nome: usuario.curso.nome,
        },
        permissoes: usuario.permissoes,
      })
    );
  });
}
