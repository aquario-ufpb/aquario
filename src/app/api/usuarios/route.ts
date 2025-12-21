import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const { usuariosRepository } = getContainer();
    const usuarios = await usuariosRepository.findMany();

    // Return users without sensitive data
    return NextResponse.json(
      usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        papelPlataforma: u.papelPlataforma,
        eVerificado: u.eVerificado,
        urlFotoPerfil: u.urlFotoPerfil,
        centro: {
          id: u.centro.id,
          nome: u.centro.nome,
          sigla: u.centro.sigla,
        },
        curso: {
          id: u.curso.id,
          nome: u.curso.nome,
        },
        permissoes: u.permissoes,
      }))
    );
  });
}

