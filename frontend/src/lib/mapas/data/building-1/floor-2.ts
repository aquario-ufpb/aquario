import type { Floor } from "../../types";

export const floor: Floor = {
  id: "2nd-floor",
  name: "2º Andar",
  level: 2,
  blueprint: {
    width: 500,
    height: 355,
  },
  rooms: [
    // Top section: 9 rooms with equal width
    {
      id: "ci-219",
      name: "CI 219",
      shapes: [{ position: { x: 0, y: 0 }, size: { width: 55, height: 135 } }],
      metadata: {
        number: "219",
        type: "office",
        description: "Sala de Professor",
        professors: ["Ruy", "Mardson", "Henrique"],
      },
    },
    {
      id: "ci-220",
      name: "CI 220",
      shapes: [{ position: { x: 55, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "220",
        type: "office",
        description: "Sala de Professor",
        professors: ["GLedson Elias", "Gustavo Motta", "Natasha Queiroz"],
      },
    },
    {
      id: "ci-221",
      name: "CI 221",
      shapes: [{ position: { x: 110, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "221",
        type: "office",
        description: "Sala de Professor",
        professors: ["José Antonio", "Vitor", "Alan"],
      },
    },
    {
      id: "ci-222",
      name: "CI 222",
      shapes: [{ position: { x: 165, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "222",
        type: "office",
        description: "Sala de Professor",
        professors: ["Roberto Quirino", "Moisés Dantas", "Aparecida de Souza"],
      },
    },
    {
      id: "ci-223",
      name: "CI 223",
      shapes: [{ position: { x: 220, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "223",
        type: "office",
        description: "Sala de Professor",
        professors: ["Lucídio Cabral", "Bruno Pessoa", "Gilberto Farias"],
      },
    },
    {
      id: "ci-224",
      name: "CI 224",
      shapes: [{ position: { x: 275, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "224",
        type: "office",
        description: "Sala de Professor",
        professors: ["Derzu Omaia", "Leonardo Vidal", "Hugo Leonardo"],
      },
    },
    {
      id: "ci-225",
      name: "CI 225",
      shapes: [{ position: { x: 330, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "225",
        type: "office",
        description: "Sala de Professor",
        professors: ["Bidu", "Leandro", "Valdecir"],
      },
    },
    {
      id: "ci-226",
      name: "CI 226",
      shapes: [{ position: { x: 385, y: 0 }, size: { width: 55, height: 115 } }],
      metadata: {
        number: "226",
        type: "office",
        description: "Sala de Professor",
        professors: ["Danielle Rousy", "Fernando Matos", "Marcelo Yuri"],
      },
    },
    {
      id: "ci-227",
      name: "CI 227",
      shapes: [{ position: { x: 440, y: 0 }, size: { width: 60, height: 115 } }],
      metadata: {
        number: "227",
        type: "office",
        description: "Sala de Professor. Também pertence ao MCC (Meninas na Ciência da Computação)",
        professors: ["MCC", "Josilene Aires", "Giorgia Mattos"],
      },
    },
    // Corridor (copied from floor-1)
    {
      id: "corredor",
      name: "Corredor",
      shapes: [
        { position: { x: 55, y: 115 }, size: { width: 450, height: 20 } },
        { position: { x: 55, y: 220 }, size: { width: 445, height: 20 } },
        { position: { x: 345, y: 135 }, size: { width: 45, height: 85 } },
        { position: { x: 255, y: 240 }, size: { width: 20, height: 100 } },
        { position: { x: 0, y: 340 }, size: { width: 500, height: 15 } },
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
      id: "ci-209",
      name: "CI 209",
      shapes: [{ position: { x: 0, y: 220 }, size: { width: 55, height: 70 } }],
      metadata: {
        number: "209",
        type: "office",
        description: "Sala de Professor",
        professors: ["Raimundo"],
      },
    },
    {
      id: "ci-210",
      name: "CI 210",
      shapes: [{ position: { x: 0, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "210",
        type: "office",
        description: "Sala de Professor",
      },
    },
    {
      id: "ci-208",
      name: "CI 208",
      shapes: [{ position: { x: 55, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "208",
        type: "office",
        description: "Sala de Professor",
        professors: ["Gustavo Peixoto", "Tatiana Araújo"],
      },
    },
    {
      id: "ci-211",
      name: "CI 211",
      shapes: [{ position: { x: 55, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "211",
        type: "office",
        description: "Sala de Professor",
        professors: ["Yuska", "Lincoln"],
      },
    },
    {
      id: "ci-207",
      name: "CI 207",
      shapes: [{ position: { x: 110, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "207",
        type: "office",
        description: "Sala de Professor",
        professors: ["Jairo", "Sérgio"],
      },
    },
    {
      id: "ci-212",
      name: "CI 212",
      shapes: [{ position: { x: 110, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "212",
        type: "office",
        description: "Sala de Professor",
        professors: ["Rostand", "Raoni"],
      },
    },
    {
      id: "ci-206",
      name: "CI 206",
      shapes: [{ position: { x: 165, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "206",
        type: "office",
        description: "Sala de Professor",
        professors: ["Clauirton", "Coutinho"],
      },
    },
    {
      id: "ci-213",
      name: "CI 213",
      shapes: [{ position: { x: 165, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "213",
        type: "office",
        description: "Sala de Professor",
        professors: ["Ed Porto", "Liliane"],
      },
    },
    {
      id: "ci-205",
      name: "CI 205",
      shapes: [{ position: { x: 220, y: 240 }, size: { width: 35, height: 50 } }],
      metadata: {
        number: "205",
        type: "office",
        description: "Sala de Professor",
        professors: ["Teobaldo"],
      },
    },
    {
      id: "ci-214",
      name: "CI 214",
      shapes: [{ position: { x: 220, y: 290 }, size: { width: 35, height: 50 } }],
      metadata: {
        number: "214",
        type: "office",
        description: "Sala de Professor",
        professors: ["Bruno Bruck"],
      },
    },
    {
      id: "ci-204",
      name: "CI 204",
      shapes: [{ position: { x: 275, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "204",
        type: "office",
        description: "Sala de Professor",
        professors: ["Andrei"],
      },
    },
    {
      id: "ci-215",
      name: "CI 215",
      shapes: [{ position: { x: 275, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "215",
        type: "office",
        description: "Sala de Professor",
        professors: ["Elizabet Spohr", "Álvaro Medeiros"],
      },
    },
    {
      id: "ci-203",
      name: "CI 203",
      shapes: [{ position: { x: 330, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "203",
        type: "office",
        description: "Sala de Professor",
        professors: ["Boness", "Ana Paula"],
      },
    },
    {
      id: "ci-216",
      name: "CI 216",
      shapes: [{ position: { x: 330, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "216",
        type: "office",
        description: "Sala de Professor",
        professors: ["Miguel Aroztegui"],
      },
    },
    {
      id: "ci-202",
      name: "CI 202",
      shapes: [{ position: { x: 385, y: 240 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "202",
        type: "office",
        description: "Sala de Professor",
        professors: ["Daniela", "Thaís"],
      },
    },
    {
      id: "ci-217",
      name: "CI 217",
      shapes: [{ position: { x: 385, y: 290 }, size: { width: 55, height: 50 } }],
      metadata: {
        number: "217",
        type: "office",
        description: "Sala de Professor",
        professors: ["Iguatemi", "Anand"],
      },
    },
    {
      id: "ci-201",
      name: "CI 201",
      shapes: [{ position: { x: 440, y: 240 }, size: { width: 60, height: 50 } }],
      metadata: {
        number: "201",
        type: "office",
        description: "Sala de Professor",
        professors: ["Camila", "Luciano"],
      },
    },
    {
      id: "ci-218",
      name: "CI 218",
      shapes: [{ position: { x: 440, y: 290 }, size: { width: 60, height: 50 } }],
      metadata: {
        number: "218",
        type: "office",
        description: "Sala de Professor",
        professors: ["Kely", "Felipe"],
      },
    },
  ],
};
