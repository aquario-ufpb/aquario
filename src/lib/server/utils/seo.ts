/**
 * SEO helpers shared across server pages, robots.ts, and sitemap.ts.
 */

/**
 * Serialize a JSON-LD object for inlining inside a `<script type="application/ld+json">`
 * tag. Escapes `<` so user-controlled fields containing `</script>` (or any HTML
 * marker) cannot break out of the script context — the canonical fix for the
 * `dangerouslySetInnerHTML` + JSON.stringify XSS vector.
 */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Returns the site origin (no trailing slash) when configured, or `null` when
 * `NEXT_PUBLIC_APP_URL` is unset in production. In development we fall back to
 * localhost so dev builds keep working without env wiring.
 *
 * Callers should fail closed when this returns null — emit empty/partial output
 * rather than `localhost` URLs to search engines. The sitemap revalidates
 * hourly, so a missing-env build degrades to an empty sitemap that repopulates
 * automatically once the deploy environment provides the URL.
 */
export function getSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) {
    return url.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return "http://localhost:3000";
}
