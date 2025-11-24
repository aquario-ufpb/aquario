import type { FloorLayout } from "../../../types";

export const floorTerreo: FloorLayout = {
  id: "ground-floor",
  name: "Térreo",
  level: 0,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    {
      id: "biblioteca-t05",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 170, height: 135 } }],
    },
    {
      id: "ci-t06",
      shapes: [{ position: { x: 170, y: 0 }, size: { width: 110, height: 115 } }],
    },
    {
      id: "laboratorio-07",
      shapes: [{ position: { x: 280, y: 0 }, size: { width: 220, height: 115 } }],
    },
    {
      id: "banheiro-feminino",
      shapes: [{ position: { x: 390, y: 135 }, size: { width: 55, height: 42 } }],
    },
    {
      id: "banheiro-masculino",
      shapes: [{ position: { x: 390, y: 177 }, size: { width: 55, height: 43 } }],
    },
    {
      id: "aquario",
      shapes: [{ position: { x: 390, y: 220 }, size: { width: 110, height: 135 } }],
    },
    {
      id: "assessoria-administracao-t03",
      shapes: [
        { position: { x: 0, y: 240 }, size: { width: 105, height: 115 } },
        { position: { x: 0, y: 220 }, size: { width: 150, height: 20 } },
      ],
    },
    {
      id: "corredor",
      shapes: [
        { position: { x: 170, y: 115 }, size: { width: 340, height: 20 } },
        { position: { x: 150, y: 220 }, size: { width: 240, height: 20 } },
        { position: { x: 210, y: 240 }, size: { width: 180, height: 115 } },
        { position: { x: 345, y: 135 }, size: { width: 45, height: 85 } },
      ],
    },
    {
      id: "auditorio-t02",
      shapes: [{ position: { x: 105, y: 240 }, size: { width: 105, height: 115 } }],
    },
  ],
};
