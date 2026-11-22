import { after } from "next/server";
import { getContainer } from "@/lib/server/container";
import { createLogger } from "@/lib/server/utils/logger";
import { notificarNovoProjeto } from "./notificacoes";

const log = createLogger("push/novo-projeto");

type ProjetoPublicado = {
  id: string;
  slug: string;
  titulo: string;
  autores: { autorPrincipal: boolean; entidadeId: string | null }[];
};

/**
 * Agenda o push de "novo projeto" depois da resposta. Chamado por toda rota que leva um projeto a
 * `PUBLICADO` (criação já publicada, `PATCH` de status e `/publish`).
 *
 * Só projetos de entidade (a categoria do app é "novidades das entidades") e só uma vez por
 * projeto: `marcarNotificado` é atômico e não é limpo ao despublicar. Falhas só vão para o log,
 * nunca para a resposta da rota.
 */
export function agendarAvisoDeNovoProjeto(projeto: ProjetoPublicado) {
  const entidadeId = projeto.autores.find(
    autor => autor.autorPrincipal && autor.entidadeId
  )?.entidadeId;
  if (!entidadeId) {
    return;
  }
  after(async () => {
    try {
      const { projetosRepository, entidadesRepository } = getContainer();
      // Título e URL vêm da linha marcada, não do momento do agendamento.
      const marcado = await projetosRepository.marcarNotificado(projeto.id);
      if (!marcado) {
        return;
      }
      const entidade = await entidadesRepository.findById(entidadeId);
      if (entidade) {
        await notificarNovoProjeto(marcado, entidade.nome);
      }
    } catch (error) {
      log.error("Falha ao notificar novo projeto", { slug: projeto.slug, error: String(error) });
    }
  });
}
