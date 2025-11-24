import type { FloorLayout } from "../../../types";

export const floor3: FloorLayout = {
  id: "3rd-floor",
  name: "3º Andar",
  level: 3,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    {
      id: "ci-312",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 55, height: 135 } }],
    },
    {
      id: "ci-313",
      shapes: [{ position: { x: 55, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-314",
      shapes: [{ position: { x: 110, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-315",
      shapes: [{ position: { x: 165, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-316",
      shapes: [{ position: { x: 220, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-317",
      shapes: [{ position: { x: 275, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-318",
      shapes: [{ position: { x: 330, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-319",
      shapes: [{ position: { x: 385, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-320",
      shapes: [{ position: { x: 440, y: 0 }, size: { width: 60, height: 115 } }],
    },
    {
      id: "corredor",
      shapes: [
        { position: { x: 55, y: 115 }, size: { width: 445, height: 20 } },
        { position: { x: 55, y: 220 }, size: { width: 335, height: 20 } },
        { position: { x: 345, y: 135 }, size: { width: 45, height: 85 } },
      ],
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
      id: "ci-311",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 55, height: 135 } }],
    },
    {
      id: "ci-310",
      shapes: [{ position: { x: 55, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-309",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-308",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-307",
      shapes: [{ position: { x: 220, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-306",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-305",
      shapes: [{ position: { x: 330, y: 240 }, size: { width: 60, height: 115 } }],
    },
    {
      id: "ci-304",
      shapes: [{ position: { x: 390, y: 220 }, size: { width: 110, height: 135 } }],
    },
  ],
};
