import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { canManageEntidade } from "./middleware";

export async function canAttributeEntidades(usuario: UsuarioWithRelations, entidadeIds: string[]) {
  const permissions = await Promise.all(entidadeIds.map(id => canManageEntidade(usuario, id)));
  return permissions.every(Boolean);
}
