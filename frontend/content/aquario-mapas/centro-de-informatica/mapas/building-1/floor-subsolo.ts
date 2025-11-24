import type { FloorLayout } from "../../../types";

export const floorSubsolo: FloorLayout = {
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
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 190, height: 135 } }],
    },
    {
      id: "sb-02",
      shapes: [{ position: { x: 190, y: 0 }, size: { width: 80, height: 135 } }],
    },
    {
      id: "almoxarifado-sb-02",
      shapes: [{ position: { x: 270, y: 0 }, size: { width: 75, height: 135 } }],
    },
    {
      id: "almoxarifado-sb-01",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 280, height: 135 } }],
    },
    {
      id: "corredor",
      shapes: [
        { position: { x: 0, y: 135 }, size: { width: 345, height: 85 } },
        { position: { x: 280, y: 220 }, size: { width: 65, height: 135 } },
      ],
    },
  ],
};
