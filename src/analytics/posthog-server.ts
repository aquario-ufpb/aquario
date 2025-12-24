import { PostHog } from "posthog-node";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST as string;

/**
 * Server-side PostHog client
 *
 * NOTE: This is a Node.js client for sending events from server-side (API routes, Server Components, etc.)
 * For client-side tracking, use trackEvent from posthog-client.ts instead.
 */
export default function PostHogClient() {
  if (!POSTHOG_KEY) {
    return null;
  }

  const posthogClient = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });

  return posthogClient;
}
