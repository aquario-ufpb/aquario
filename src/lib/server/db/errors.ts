/**
 * Domain-level repository errors. Implementations (Prisma, etc.) translate
 * persistence-layer errors into these so routes don't have to know what
 * backend the repo uses.
 */

/** Thrown when a write conflicts with an existing unique slug. */
export class SlugConflictError extends Error {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`);
    this.name = "SlugConflictError";
  }
}
