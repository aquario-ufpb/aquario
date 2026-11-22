import { NextResponse, after } from "next/server";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError, handleError } from "@/lib/server/errors";
import { recordAuditLog } from "@/lib/server/services/audit-log";
import { createLogger } from "@/lib/server/utils/logger";

export const dynamic = "force-dynamic";

const log = createLogger("usuarios/me");

/**
 * DELETE /api/usuarios/me — o próprio usuário exclui a conta (LGPD e política de exclusão de
 * conta da Google Play). Irreversível; ver `excluirConta` no repositório para o que é apagado.
 */
export async function DELETE(request: Request) {
  try {
    return await withAuth(request, async (req, usuario) => {
      // Sem isso a plataforma pode ficar sem administrador; outro admin remove a conta.
      if (usuario.papelPlataforma === "MASTER_ADMIN") {
        return ApiError.forbidden(
          "Administradores da plataforma não podem excluir a própria conta. Peça a outro administrador."
        );
      }

      const { usuariosRepository, blobStorage } = getContainer();
      let imagensOrfas: string[];
      try {
        ({ imagensOrfas } = await usuariosRepository.excluirConta(usuario.id));
      } catch (error) {
        // Transação: nada foi apagado. Não repassa a mensagem do banco ao cliente.
        log.error("Falha ao excluir conta", { usuarioId: usuario.id, error: String(error) });
        return ApiError.internal("Não foi possível excluir a conta. Tente novamente.");
      }

      // Só depois de excluir: sem autor (a conta já não existe) e sem dados pessoais.
      await recordAuditLog(req, null, {
        action: "usuario.self_deleted",
        resourceType: "usuario",
        resourceId: usuario.id,
      });

      // Limpeza das imagens depois da resposta; falha só vaza um arquivo.
      if (imagensOrfas.length) {
        after(async () => {
          const resultados = await Promise.allSettled(
            imagensOrfas.map(url => blobStorage.delete(url))
          );
          const falhas = resultados.filter(
            r => r.status === "rejected" || r.value === false
          ).length;
          if (falhas) {
            log.error("Falha ao apagar imagens da conta excluída", { falhas });
          }
        });
      }

      return NextResponse.json(
        { message: "Conta excluída com sucesso." },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    });
  } catch (error) {
    return handleError(error, "Erro ao excluir conta");
  }
}
