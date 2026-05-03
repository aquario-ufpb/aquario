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
 * `NEXT_PUBLIC_APP_URL` is unset. In development we fall back to localhost so
 * dev builds and `npm run build` keep working without env wiring.
 *
 * Use this when a missing origin should degrade gracefully (e.g. omit
 * `host`/`sitemap` from robots.txt rather than advertise localhost to crawlers).
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

/**
 * Returns the validated site origin or throws. Use this where an absolute URL
 * is structurally required (sitemap.xml entries) — failing the build/render is
 * better than emitting `localhost` URLs to search engines.
 */
export function requireSiteUrl(): string {
  const url = getSiteUrl();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set in production for absolute-URL SEO surfaces (sitemap, JSON-LD)."
    );
  }
  return url;
}
