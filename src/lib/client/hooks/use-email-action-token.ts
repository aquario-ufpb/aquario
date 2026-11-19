"use client";

import { useEffect, useRef, useState } from "react";

/** New email links use a fragment. Previously issued links use the query string. */
export function useEmailActionToken() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    const url = new URL(window.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const value = fragment.get("token") || url.searchParams.get("token");
    if (fragment.has("token") || url.searchParams.has("token")) {
      fragment.delete("token");
      url.hash = fragment.toString();
      url.searchParams.delete("token");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    setToken(value);
  }, []);
  return token;
}
