import type { Floor } from "../../types";

export const floor: Floor = {
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
      name: "CI 106",
      shapes: [
        { position: { x: 0, y: 0 }, size: { width: 115, height: 115 } },
        { position: { x: 0, y: 115 }, size: { width: 55, height: 20 } },
      ],
      metadata: {
        number: "106",
        type: "classroom",
        description: "Sala de aula CI 106",
      },
    },
    {
      id: "ci-107",
      name: "CI 107",
      shapes: [{ position: { x: 115, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "107",
        type: "classroom",
        description: "Sala de aula CI 107",
      },
    },
    {
      id: "ci-108",
      name: "CI 108",
      shapes: [{ position: { x: 170, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "108",
        type: "classroom",
        description: "Sala de aula CI 108",
      },
    },
    {
      id: "ci-109",
      name: "CI 109",
      shapes: [{ position: { x: 225, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "109",
        type: "classroom",
        description: "Sala de aula CI 109",
      },
    },
    {
      id: "ci-110",
      name: "CI 110",
      shapes: [{ position: { x: 280, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "110",
        type: "classroom",
        description: "Sala de aula CI 110",
      },
    },
    {
      id: "ci-111",
      name: "CI 111",
      shapes: [{ position: { x: 335, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "111",
        type: "classroom",
        description: "Sala de aula CI 111",
      },
    },
    {
      id: "assesoria",
      name: "Assesoria",
      shapes: [{ position: { x: 390, y: 0 }, size: { width: 110, height: 70 } }],
      metadata: {
        number: "ASS",
        type: "office",
        description: "Assessoria",
      },
    },
    {
      id: "ci-112",
      name: "CI 112",
      shapes: [{ position: { x: 390, y: 70 }, size: { width: 110, height: 65 } }],
      metadata: {
        number: "112",
        type: "classroom",
        description: "Sala de aula CI 112",
      },
    },
    {
      id: "corredor",
      name: "Corredor",
      shapes: [
        { position: { x: 55, y: 115 }, size: { width: 290, height: 20 } },
        { position: { x: 55, y: 220 }, size: { width: 445, height: 20 } },
        { position: { x: 345, y: 115 }, size: { width: 45, height: 105 } },
      ],
      metadata: {
        number: "COR",
        type: "corridor",
        description: "Corredor",
      },
    },
    {
      id: "ci-105",
      name: "CI 105",
      shapes: [
        { position: { x: 0, y: 240 }, size: { width: 110, height: 115 } },
        { position: { x: 0, y: 220 }, size: { width: 55, height: 20 } },
      ],
      metadata: {
        number: "105",
        type: "classroom",
        description: "Sala de aula CI 105",
      },
    },
    {
      id: "ci-104",
      name: "CI 104",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "104",
        type: "classroom",
        description: "Sala de aula CI 104",
      },
    },
    {
      id: "ci-103",
      name: "CI 103",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 110, height: 115 } }],
      metadata: {
        number: "103",
        type: "classroom",
        description: "Sala de aula CI 103",
      },
    },
    {
      id: "ci-102",
      name: "CI 102",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 115, height: 115 } }],
      metadata: {
        number: "102",
        type: "classroom",
        description: "Sala de aula CI 102",
      },
    },
    {
      id: "ci-101",
      name: "CI 101",
      shapes: [{ position: { x: 390, y: 240 }, size: { width: 110, height: 115 } }],
      metadata: {
        number: "101",
        type: "classroom",
        description: "Sala de aula CI 101",
      },
    },
    {
      id: "banheiro-feminino",
      name: "Banheiro Feminino",
      shapes: [{ position: { x: 390, y: 135 }, size: { width: 55, height: 42 } }],
      metadata: {
        number: "BF",
        type: "bathroom",
        description: "Banheiro Feminino",
      },
    },
    {
      id: "banheiro-masculino",
      name: "Banheiro Masculino",
      shapes: [{ position: { x: 390, y: 177 }, size: { width: 55, height: 43 } }],
      metadata: {
        number: "BM",
        type: "bathroom",
        description: "Banheiro Masculino",
      },
    },
  ],
};
