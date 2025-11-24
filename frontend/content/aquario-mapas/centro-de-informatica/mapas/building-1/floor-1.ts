import type { FloorLayout } from "../../../types";

export const floor1: FloorLayout = {
  id: "1st-floor",
  name: "1º Andar",
  level: 1,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    {
      id: "ci-106",
      shapes: [
        { position: { x: 0, y: 0 }, size: { width: 115, height: 115 } },
        { position: { x: 0, y: 115 }, size: { width: 55, height: 20 } },
      ],
    },
    {
      id: "ci-107",
      shapes: [{ position: { x: 115, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-108",
      shapes: [{ position: { x: 170, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-109",
      shapes: [{ position: { x: 225, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-110",
      shapes: [{ position: { x: 280, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-111",
      shapes: [{ position: { x: 335, y: 0 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "assesoria",
      shapes: [{ position: { x: 390, y: 0 }, size: { width: 110, height: 70 } }],
    },
    {
      id: "ci-112",
      shapes: [{ position: { x: 390, y: 70 }, size: { width: 110, height: 65 } }],
    },
    {
      id: "corredor",
      shapes: [
        { position: { x: 55, y: 115 }, size: { width: 290, height: 20 } },
        { position: { x: 55, y: 220 }, size: { width: 445, height: 20 } },
        { position: { x: 345, y: 115 }, size: { width: 45, height: 105 } },
      ],
    },
    {
      id: "ci-105",
      shapes: [
        { position: { x: 0, y: 240 }, size: { width: 110, height: 115 } },
        { position: { x: 0, y: 220 }, size: { width: 55, height: 20 } },
      ],
    },
    {
      id: "ci-104",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 115 } }],
    },
    {
      id: "ci-103",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 110, height: 115 } }],
    },
    {
      id: "ci-102",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 115, height: 115 } }],
    },
    {
      id: "ci-101",
      shapes: [{ position: { x: 390, y: 240 }, size: { width: 110, height: 115 } }],
    },
    {
      id: "banheiro-feminino",
      shapes: [{ position: { x: 390, y: 135 }, size: { width: 55, height: 42 } }],
    },
    {
      id: "banheiro-masculino",
      shapes: [{ position: { x: 390, y: 177 }, size: { width: 55, height: 43 } }],
    },
  ],
};
