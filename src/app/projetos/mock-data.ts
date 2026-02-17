import { Projeto } from "@/components/shared/project-card";

export const MOCK_PROJETOS: Projeto[] = [
  {
    id: "mock-1",
    nome: "Aquário",
    descricao:
      "Plataforma central do Centro de Informática para gestão de laboratórios, projetos e transparência. Desenvolvida para facilitar a comunicação e o acesso à informação.",
    imagem: "/logo.png", // Correct path for public assets
    tipo: "PESSOAL",
    tags: ["React", "Next.js", "Gestão", "Open Source"],
    publicador: {
      id: "pub-1",
      nome: "Tiago Trindade",
      tipo: "USUARIO",
      urlFotoPerfil: null,
    },
    colaboradores: [
      { id: "colab-1", nome: "Davi Alves", urlFotoPerfil: null },
      { id: "colab-2", nome: "Gabriel Barbosa", urlFotoPerfil: null },
      { id: "colab-3", nome: "Gabriel Felix", urlFotoPerfil: null },
    ],
    criadoEm: "2026-02-14T10:00:00Z",
    linkRepositorio: "",
    linkPrototipo: "",
  },
  {
    id: "mock-2",
    nome: "Assistente de Libras com IA",
    descricao:
      "Um projeto de inclusão que utiliza visão computacional para traduzir sinais de Libras em tempo real para texto e áudio, facilitando a comunicação.",
    imagem: null,
    tipo: "PESSOAL",
    tags: ["IA", "Python", "Acessibilidade", "Visão Computacional"],
    publicador: {
      id: "pub-2",
      nome: "Ana Clara",
      tipo: "USUARIO",
      urlFotoPerfil: null,
    },
    colaboradores: [{ id: "colab-5", nome: "Lucas Oliveira", urlFotoPerfil: null }],
    criadoEm: "2023-11-20T14:30:00Z",
    linkRepositorio: "",
    linkPrototipo: "",
  },
  {
    id: "mock-3",
    nome: "Maratona de Programação 2024",
    descricao:
      "Sistema de gestão para a maratona de programação, incluindo placar em tempo real, submissão de problemas e gestão de equipes.",
    imagem: null,
    tipo: "ENTIDADE",
    tags: ["Competição", "Algoritmos", "C++", "Real-time"],
    publicador: {
      id: "pub-3",
      nome: "Grupo de Maratona",
      tipo: "ENTIDADE",
      urlFotoPerfil: null,
    },
    colaboradores: [],
    criadoEm: "2024-02-01T09:00:00Z",
    linkRepositorio: "",
    linkPrototipo: "",
  },
  {
    id: "mock-4",
    nome: "Robô de Limpeza Autônomo",
    descricao:
      "Protótipo de um robô capaz de mapear ambientes e realizar limpeza autônoma utilizando sensores LIDAR e algoritmos de SLAM.",
    imagem: null,
    tipo: "LABORATORIO",
    tags: ["Robótica", "ROS", "C++", "Hardware"],
    publicador: {
      id: "pub-4",
      nome: "Laboratório de Robótica (L.A.R)",
      tipo: "ENTIDADE",
      urlFotoPerfil: null,
    },
    colaboradores: [
      { id: "colab-6", nome: "Roberto Costa", urlFotoPerfil: null },
      { id: "colab-7", nome: "Fernanda Lima", urlFotoPerfil: null },
    ],
    criadoEm: "2023-08-10T11:20:00Z",
    linkRepositorio: "",
    linkPrototipo: "",
  },
  {
    id: "mock-5",
    nome: "Liga de Investimentos Financeiros",
    descricao:
      "Grupo focado em estudos e simulações de mercado financeiro, algoritmos de trading e educação financeira para estudantes.",
    imagem: null,
    tipo: "LIGA",
    tags: ["Finanças", "Python", "Trading", "Economia"],
    publicador: {
      id: "pub-5",
      nome: "Liga de Finanças",
      tipo: "ENTIDADE",
      urlFotoPerfil: null,
    },
    colaboradores: [
      { id: "colab-8", nome: "André Souza", urlFotoPerfil: null },
      { id: "colab-9", nome: "Beatriz Mota", urlFotoPerfil: null },
    ],
    criadoEm: "2024-03-10T16:00:00Z",
    linkRepositorio: "",
    linkPrototipo: "",
  },
];
