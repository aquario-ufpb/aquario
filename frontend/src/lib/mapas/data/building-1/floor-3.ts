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
    // Top section: 9 rooms with equal width (312-320, left to right)
    {
      id: "ci-312",
      name: "CI 312",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 55, height: 135 } }],
      metadata: {
        number: "312",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["lmi"],
      },
    },
    {
      id: "ci-313",
      name: "CI 313",
      shapes: [{ position: { x: 55, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "313",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["COMPOSE", "LIA", "DAT", "AVIS", "LAQSS"],
      },
    },
    {
      id: "ci-314",
      name: "CI 314",
      shapes: [{ position: { x: 110, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "314",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["zoox-smart-data"],
      },
    },
    {
      id: "ci-315",
      name: "CI 315",
      shapes: [{ position: { x: 165, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "315",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["tril"],
      },
    },
    {
      id: "ci-316",
      name: "CI 316",
      shapes: [{ position: { x: 220, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "316",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["laporte"],
      },
    },
    {
      id: "ci-317",
      name: "CI 317",
      shapes: [{ position: { x: 275, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "317",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["lar"],
      },
    },
    {
      id: "ci-318",
      name: "CI 318",
      shapes: [{ position: { x: 330, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "318",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["lumo"],
      },
    },
    {
      id: "ci-319",
      name: "CI 319",
      shapes: [{ position: { x: 385, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "319",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["lim"],
      },
    },
    {
      id: "ci-320",
      name: "CI 320",
      shapes: [{ position: { x: 440, y: 0 }, size: { width: 60, height: 115 } }],
      metadata: {
        number: "320",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["lasid"],
      },
    },
    // Corridor (copied from floor-1)
    {
      id: "corredor",
      name: "Corredor",
      shapes: [
        { position: { x: 55, y: 115 }, size: { width: 445, height: 20 } },
        { position: { x: 55, y: 220 }, size: { width: 335, height: 20 } },
        { position: { x: 345, y: 135 }, size: { width: 45, height: 85 } },
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
    // Bottom section: 9 rooms with equal width (311-303, left to right)
    {
      id: "ci-311",
      name: "CI 311",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 55, height: 135 } }],
      metadata: {
        number: "311",
        type: "classroom",
        description: "Sala de aula CI 311",
      },
    },
    {
      id: "ci-310",
      name: "CI 310",
      shapes: [{ position: { x: 55, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "310",
        type: "classroom",
        description: "Sala de aula CI 310",
      },
    },
    {
      id: "ci-309",
      name: "CI 309",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "309",
        type: "classroom",
        description: "Sala de aula CI 309",
      },
    },
    {
      id: "ci-308",
      name: "CI 308",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "308",
        type: "classroom",
        description: "Sala de aula CI 308",
      },
    },
    {
      id: "ci-307",
      name: "CI 307",
      shapes: [{ position: { x: 220, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "307",
        type: "classroom",
        description: "Sala de aula CI 307",
      },
    },
    {
      id: "ci-306",
      name: "CI 306",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "306",
        type: "classroom",
        description: "Sala de aula CI 306",
      },
    },
    {
      id: "ci-305",
      name: "CI 305",
      shapes: [{ position: { x: 330, y: 240 }, size: { width: 60, height: 115 } }],
      metadata: {
        number: "305",
        type: "lab (pesquisa)",
        description: "Laboratório de Pesquisa",
        labs: ["pet"],
      },
    },
    {
      id: "ci-304",
      name: "CI 304",
      shapes: [{ position: { x: 390, y: 220 }, size: { width: 110, height: 135 } }],
      metadata: {
        number: "304",
        type: "classroom",
        description: "Sala de aula CI 304",
      },
    },
  ],
};
