/**
 * Common test helpers and utilities for Guias testing
 */

import { Guia, Secao, SubSecao } from "@/lib/shared/types";

/**
 * Assert that a Guia has the required structure
 */
export function assertValidGuia(guia: Guia): void {
  expect(guia).toHaveProperty("id");
  expect(guia).toHaveProperty("titulo");
  expect(guia).toHaveProperty("slug");
  expect(guia).toHaveProperty("status");
  expect(guia).toHaveProperty("tags");
  expect(Array.isArray(guia.tags)).toBe(true);
}

/**
 * Assert that a Secao has the required structure
 */
export function assertValidSecao(secao: Secao): void {
  expect(secao).toHaveProperty("id");
  expect(secao).toHaveProperty("guiaId");
  expect(secao).toHaveProperty("titulo");
  expect(secao).toHaveProperty("slug");
  expect(secao).toHaveProperty("ordem");
  expect(secao).toHaveProperty("status");
  expect(typeof secao.ordem).toBe("number");
}

/**
 * Assert that a SubSecao has the required structure
 */
export function assertValidSubSecao(subsecao: SubSecao): void {
  expect(subsecao).toHaveProperty("id");
  expect(subsecao).toHaveProperty("secaoId");
  expect(subsecao).toHaveProperty("titulo");
  expect(subsecao).toHaveProperty("slug");
  expect(subsecao).toHaveProperty("ordem");
  expect(subsecao).toHaveProperty("status");
  expect(typeof subsecao.ordem).toBe("number");
}

/**
 * Find a Guia by slug
 */
export function findGuiaBySlug(guias: Guia[], slug: string): Guia | undefined {
  return guias.find(guia => guia.slug === slug);
}

/**
 * Find a Secao by slug
 */
export function findSecaoBySlug(secoes: Secao[], slug: string): Secao | undefined {
  return secoes.find(secao => secao.slug === slug);
}

/**
 * Find a SubSecao by slug
 */
export function findSubSecaoBySlug(subsecoes: SubSecao[], slug: string): SubSecao | undefined {
  return subsecoes.find(subsecao => subsecao.slug === slug);
}
