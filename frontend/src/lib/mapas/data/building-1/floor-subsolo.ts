import type { Floor } from "../../types";

export const floorSubsolo: Floor = {
  id: "basement-floor",
  name: "Subsolo",
  level: -1,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    {
      id: "sb-01",
      name: "SB 01",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 190, height: 135 } }],
      metadata: {
        number: "01",
        type: "classroom",
        description: "SB 01",
      },
    },
    {
      id: "sb-02",
      name: "SB 02",
      title: "Centros Acadêmicos",
      shapes: [{ position: { x: 190, y: 0 }, size: { width: 80, height: 135 } }],
      metadata: {
        number: "02",
        type: "office",
        description: "CAs",
      },
    },
    {
      id: "almoxarifado-sb-02",
      name: "Almoxarifado",
      shapes: [{ position: { x: 270, y: 0 }, size: { width: 75, height: 135 } }],
      metadata: {
        number: "02",
        type: "other",
        description: "Almoxarifado",
      },
    },
    {
      id: "almoxarifado-sb-01",
      name: "Almoxarifado",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 280, height: 135 } }],
      metadata: {
        number: "01",
        type: "other",
        description: "Almoxarifado",
      },
    },
    {
      id: "corredor",
      name: "Corredor",
      shapes: [
        { position: { x: 0, y: 135 }, size: { width: 345, height: 85 } },
        { position: { x: 280, y: 220 }, size: { width: 65, height: 135 } },
      ],
      metadata: {
        number: "COR",
        type: "corridor",
        description: "Corredor",
      },
    },
  ],
};
