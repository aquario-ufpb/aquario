import type { Floor } from "../../types";

export const floor: Floor = {
  id: "3rd-floor",
  name: "3º Andar",
  level: 3,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    // Top section: 9 rooms with equal width
    {
      id: "ci-306",
      name: "CI 306",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 55, height: 135 } }],
      metadata: {
        number: "306",
        type: "classroom",
        description: "Sala de aula CI 306",
      },
    },
    {
      id: "ci-307",
      name: "CI 307",
      shapes: [{ position: { x: 55, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "307",
        type: "classroom",
        description: "Sala de aula CI 307",
      },
    },
    {
      id: "ci-308",
      name: "CI 308",
      shapes: [{ position: { x: 110, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "308",
        type: "classroom",
        description: "Sala de aula CI 308",
      },
    },
    {
      id: "ci-309",
      name: "CI 309",
      shapes: [{ position: { x: 165, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "309",
        type: "classroom",
        description: "Sala de aula CI 309",
      },
    },
    {
      id: "ci-310",
      name: "CI 310",
      shapes: [{ position: { x: 220, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "310",
        type: "classroom",
        description: "Sala de aula CI 310",
      },
    },
    {
      id: "ci-311",
      name: "CI 311",
      shapes: [{ position: { x: 275, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "311",
        type: "classroom",
        description: "Sala de aula CI 311",
      },
    },
    {
      id: "ci-312",
      name: "CI 312",
      shapes: [{ position: { x: 330, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "312",
        type: "classroom",
        description: "Sala de aula CI 312",
      },
    },
    {
      id: "ci-313",
      name: "CI 313",
      shapes: [{ position: { x: 385, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "313",
        type: "classroom",
        description: "Sala de aula CI 313",
      },
    },
    {
      id: "ci-314",
      name: "CI 314",
      shapes: [{ position: { x: 440, y: 0 }, size: { width: 60, height: 115 } }],
      metadata: {
        number: "314",
        type: "classroom",
        description: "Sala de aula CI 314",
      },
    },
    // Corridor (copied from floor-1)
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
    // Bathrooms (copied from floor-1)
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
    // Bottom section: 9 rooms with equal width
    {
      id: "ci-305",
      name: "CI 305",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 55, height: 135 } }],
      metadata: {
        number: "305",
        type: "classroom",
        description: "Sala de aula CI 305",
      },
    },
    {
      id: "ci-304",
      name: "CI 304",
      shapes: [{ position: { x: 55, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "304",
        type: "classroom",
        description: "Sala de aula CI 304",
      },
    },
    {
      id: "ci-303",
      name: "CI 303",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "303",
        type: "classroom",
        description: "Sala de aula CI 303",
      },
    },
    {
      id: "ci-302",
      name: "CI 302",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "302",
        type: "classroom",
        description: "Sala de aula CI 302",
      },
    },
    {
      id: "ci-301",
      name: "CI 301",
      shapes: [{ position: { x: 220, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "301",
        type: "classroom",
        description: "Sala de aula CI 301",
      },
    },
    {
      id: "ci-300",
      name: "CI 300",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "300",
        type: "classroom",
        description: "Sala de aula CI 300",
      },
    },
    {
      id: "ci-299",
      name: "CI 299",
      shapes: [{ position: { x: 330, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "299",
        type: "classroom",
        description: "Sala de aula CI 299",
      },
    },
    {
      id: "ci-298",
      name: "CI 298",
      shapes: [{ position: { x: 385, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "298",
        type: "classroom",
        description: "Sala de aula CI 298",
      },
    },
    {
      id: "ci-297",
      name: "CI 297",
      shapes: [{ position: { x: 440, y: 240 }, size: { width: 60, height: 115 } }],
      metadata: {
        number: "297",
        type: "classroom",
        description: "Sala de aula CI 297",
      },
    },
  ],
};
