import { z } from "zod";

/** Existing IDs use the hexadecimal UUID layout without restricting version or variant bits. */
export function uuidSchema(error?: string) {
  return z.guid(error).meta({ format: "uuid" });
}
