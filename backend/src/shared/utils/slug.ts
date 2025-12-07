/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to slug
 * @returns The slugified string
 */
export function nomeToSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Gets the slug for an entidade, checking metadata first, then generating from nome
 * @param nome - The name of the entidade
 * @param metadata - The metadata object that may contain a slug
 * @returns The slug to use
 */
export function getEntidadeSlug(
  nome: string,
  metadata: Record<string, unknown> | null | undefined
): string {
  if (metadata && typeof metadata === 'object' && 'slug' in metadata) {
    const slug = metadata.slug;
    if (typeof slug === 'string' && slug.trim()) {
      return slug.trim();
    }
  }
  // Fallback to generating from nome
  return nomeToSlug(nome);
}
