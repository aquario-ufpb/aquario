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
      id: "biblioteca-t05",
      name: "CI T05",
      title: "Biblioteca",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 170, height: 135 } }],
      metadata: {
        number: "T05",
        type: "library",
        description: "Biblioteca T05",
      },
    },
    {
      id: "ci-t06",
      name: "CI T06",
      shapes: [{ position: { x: 170, y: 0 }, size: { width: 110, height: 115 } }],
      metadata: {
        number: "T06",
        type: "classroom",
        description: "Sala de aula CI T06",
      },
    },
    {
      id: "laboratorio-07",
      name: "CI T07",
      title: "Laboratório",
      shapes: [{ position: { x: 280, y: 0 }, size: { width: 220, height: 115 } }],
      metadata: {
        number: "T07",
        type: "lab (aula)",
        description: "Laboratório 07",
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
    {
      id: "aquario",
      name: "Aquário",
      shapes: [{ position: { x: 390, y: 220 }, size: { width: 110, height: 135 } }],
      metadata: {
        number: "AQ",
        type: "shared-space",
        description: "Aquário",
      },
    },
    {
      id: "assessoria-administracao-t03",
      name: "CI T03",
      title: "Assessoria de administração",
      shapes: [
        { position: { x: 0, y: 240 }, size: { width: 105, height: 115 } },
        { position: { x: 0, y: 220 }, size: { width: 150, height: 20 } },
      ],
      metadata: {
        number: "T03",
        type: "office",
        description: "Assessoria de administração T03",
      },
    },
    {
      id: "corredor",
      name: "Corredor",
      shapes: [
        { position: { x: 170, y: 115 }, size: { width: 340, height: 20 } },
        { position: { x: 150, y: 220 }, size: { width: 240, height: 20 } },
        { position: { x: 210, y: 240 }, size: { width: 180, height: 115 } },
        { position: { x: 345, y: 135 }, size: { width: 45, height: 85 } },
      ],
      metadata: {
        number: "COR",
        type: "corridor",
        description: "Corredor",
      },
    },
    {
      id: "auditorio-t02",
      name: "CI T02",
      title: "Auditório",
      shapes: [{ position: { x: 105, y: 240 }, size: { width: 105, height: 115 } }],
      metadata: {
        number: "T02",
        type: "classroom",
        description: "Auditório T02",
      },
    },
  ],
};
