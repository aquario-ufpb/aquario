const EXPLICIT_LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isExplicitLoopbackHostname(hostname: string): boolean {
  return EXPLICIT_LOOPBACK_HOSTNAMES.has(hostname);
}
