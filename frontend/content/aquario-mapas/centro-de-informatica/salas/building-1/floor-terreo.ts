import type { Room } from "../../../types";

export const rooms: Room[] = [
  {
    id: "biblioteca-t05",
    location: "CI T05",
    type: "library",
    description: "Biblioteca T05",
  },
  {
    id: "ci-t06",
    location: "CI T06",
    type: "classroom",
    description: "Sala de aula CI T06",
  },
  {
    id: "laboratorio-07",
    location: "CI T07",
    type: "lab-class",
    description: "Laboratório 07",
  },
  {
    id: "banheiro-feminino",
    location: "Banheiro Feminino",
    type: "bathroom",
    description: "Banheiro Feminino",
    gender: "female",
  },
  {
    id: "banheiro-masculino",
    location: "Banheiro Masculino",
    type: "bathroom",
    description: "Banheiro Masculino",
    gender: "male",
  },
  {
    id: "aquario",
    location: "Aquário",
    type: "shared-space",
    description: "Aquário",
  },
  {
    id: "assessoria-administracao-t03",
    location: "CI T03",
    type: "institutional-office",
    description: "Assessoria de administração T03",
  },
  {
    id: "corredor",
    location: "Corredor",
    type: "corridor",
    description: "Corredor",
  },
  {
    id: "auditorio-t02",
    location: "CI T02",
    type: "classroom",
    description: "Auditório T02",
  },
];
