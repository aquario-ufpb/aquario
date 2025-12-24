"use client";

import { useEffect, useState } from "react";
import type { Floor, EntidadeSlug } from "@/lib/client/mapas/types";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import { entidadesService } from "@/lib/client/api/entidades";
import { isLabResearch } from "@/lib/client/mapas/utils";

export function useEntidadesMap(rooms: Floor["rooms"]) {
  const [entidadesMap, setEntidadesMap] = useState<Map<EntidadeSlug, Entidade>>(new Map());

  useEffect(() => {
    const loadEntidades = async () => {
      const slugs = new Set<EntidadeSlug>();

      // Collect all lab slugs from rooms
      rooms.forEach(room => {
        if (isLabResearch(room) && room.labs) {
          room.labs.forEach(slug => slugs.add(slug));
        }
      });

      // Fetch all entidades
      const entidades = await Promise.all(
        Array.from(slugs).map(slug => entidadesService.getBySlug(slug))
      );

      // Create map
      const map = new Map<EntidadeSlug, Entidade>();
      entidades.forEach(entidade => {
        if (entidade) {
          map.set(entidade.slug, entidade);
        }
      });

      setEntidadesMap(map);
    };

    void loadEntidades();
  }, [rooms]);

  return entidadesMap;
}
