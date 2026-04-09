import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createVagaSchema } from "@/lib/server/api-schemas/vagas";

import type { CommonSchemas } from "../common-schemas";

/**
 * Enum dos tipos de vaga suportados. Espelha TIPO_VAGA_VALUES em
 * src/app/api/vagas/route.ts — manter em sincronia.
 */
const tipoVagaSchema = z
  .enum(["ESTAGIO", "TRAINEE", "VOLUNTARIO", "PESQUISA", "CLT", "PJ", "OUTRO"])
  .openapi({
    description: "Tipo da oportunidade de vaga.",
    example: "ESTAGIO",
  });

/**
 * Resumo do publicador embutido nas respostas de vaga — o usuário que criou a vaga.
 */
const vagaPublicadorSchema = z.object({
  nome: z.string().openapi({ example: "João Silva" }),
  urlFotoPerfil: z.string().optional(),
});

/**
 * Resumo da entidade embutido nas respostas de vaga.
 */
const vagaEntidadeSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().openapi({ example: "PET Computação" }),
  slug: z.string().optional(),
  tipo: z.string().openapi({ example: "GRUPO" }),
  urlFoto: z.string().optional(),
});

/**
 * Shape da resposta de Vaga conforme retornado por mapVagaToJson — representação
 * JSON canônica usada tanto pelo endpoint de listagem quanto pelo de detalhe.
 */
const vagaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Estágio em Desenvolvimento Backend" }),
    descricao: z.string().openapi({
      example: "Atuar no desenvolvimento de APIs em Node.js e PostgreSQL...",
    }),
    tipoVaga: tipoVagaSchema,
    areas: z.array(z.string()).openapi({ example: ["Backend", "Node.js", "PostgreSQL"] }),
    criadoEm: z.string().datetime(),
    dataFinalizacao: z.string().datetime().openapi({ example: "2026-05-15T23:59:59.000Z" }),
    linkInscricao: z.string().url().openapi({ example: "https://empresa.com/vagas/123" }),
    salario: z.string().optional().openapi({ example: "R$ 1.500,00" }),
    sobreEmpresa: z.string().optional(),
    responsabilidades: z.array(z.string()),
    requisitos: z.array(z.string()),
    informacoesAdicionais: z.string().optional(),
    etapasProcesso: z.array(z.string()),
    entidade: vagaEntidadeSchema,
    publicador: vagaPublicadorSchema,
  })
  .openapi("VagaResponse");

/**
 * Shape estendido da resposta para GET /vagas/{id} — adiciona o flag `expirada`
 * calculado a partir de `dataFinalizacao` vs hora atual.
 */
const vagaDetailResponseSchema = vagaResponseSchema
  .extend({
    expirada: z.boolean().openapi({
      description: "Indica se a vaga já passou da `dataFinalizacao`.",
      example: false,
    }),
  })
  .openapi("VagaDetailResponse");

export function registerVagasPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/vagas",
    tags: ["Vagas"],
    summary: "Listar vagas ativas",
    description:
      "Lista as vagas não expiradas. Permite filtrar por tipo de vaga e/ou categoria da entidade publicadora.",
    request: {
      query: z.object({
        tipoVaga: tipoVagaSchema.optional().openapi({
          description: "Filtra pelo tipo de vaga.",
        }),
        entidadeTipos: z.string().optional().openapi({
          description:
            "Lista separada por vírgulas dos tipos de entidade para filtrar (ex: 'LABORATORIO,GRUPO'). Tipos desconhecidos são ignorados.",
          example: "LABORATORIO,GRUPO",
        }),
      }),
    },
    responses: {
      200: {
        description: "Lista de vagas ativas.",
        content: { "application/json": { schema: z.array(vagaResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/vagas",
    tags: ["Vagas"],
    summary: "Criar uma nova vaga",
    description:
      "Publica uma nova vaga. O usuário deve ser MASTER_ADMIN ou ADMIN ativo da entidade. `dataFinalizacao` deve estar no futuro.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createVagaSchema,
            example: {
              titulo: "Estágio em Desenvolvimento Backend",
              descricao: "Atuar no desenvolvimento de APIs em Node.js e PostgreSQL...",
              tipoVaga: "ESTAGIO",
              entidadeId: "550e8400-e29b-41d4-a716-446655440000",
              linkInscricao: "https://empresa.com/vagas/123",
              dataFinalizacao: "2026-05-15",
              areas: ["Backend", "Node.js"],
              salario: "R$ 1.500,00",
              responsabilidades: ["Desenvolver APIs REST", "Escrever testes automatizados"],
              requisitos: ["Conhecimento em Node.js", "Familiaridade com PostgreSQL"],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Vaga criada com sucesso.",
        content: { "application/json": { schema: vagaResponseSchema } },
      },
      ...errorResponses([400, 404]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/vagas/{id}",
    tags: ["Vagas"],
    summary: "Buscar uma vaga pelo ID",
    description: "Retorna uma vaga única com o flag `expirada` indicando se o prazo já passou.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Detalhes da vaga.",
        content: { "application/json": { schema: vagaDetailResponseSchema } },
      },
      ...errorResponses([404]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/vagas/{id}",
    tags: ["Vagas"],
    summary: "Excluir uma vaga (soft delete)",
    description:
      "Marca uma vaga como excluída (soft delete). O usuário deve ser MASTER_ADMIN ou ADMIN ativo da entidade dona da vaga.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      204: {
        description: "Vaga excluída com sucesso. Sem corpo de resposta.",
      },
      ...errorResponses([404]),
    },
  });
}
