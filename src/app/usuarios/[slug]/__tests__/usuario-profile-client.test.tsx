import { render, screen } from "@testing-library/react";

import {
  useCurrentUser,
  useDeletePhoto,
  useUploadPhoto,
  useUserMemberships,
  useUsuarioBySlug,
} from "@/lib/client/hooks/use-usuarios";

import UsuarioProfileClient from "../usuario-profile-client";

jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({
  useUsuarioBySlug: jest.fn(),
  useCurrentUser: jest.fn(),
  useUserMemberships: jest.fn(),
  useUploadPhoto: jest.fn(),
  useDeletePhoto: jest.fn(),
}));
jest.mock("@/lib/client/hooks/use-projetos", () => ({
  useProjetosByUsuario: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useUsuarioProjetoCounts: jest.fn(() => ({ publicado: 0, rascunho: 0, arquivado: 0 })),
}));
jest.mock("@/components/pages/perfil/meus-dados-academicos-card", () => ({
  MeusDadosAcademicosCard: () => <div>Hub acadêmico</div>,
}));
jest.mock("@/components/pages/perfil/progresso-curso-card", () => ({
  ProgressoCursoCard: () => <div>Progresso do curso</div>,
}));
jest.mock("@/components/pages/perfil/entidades-tab", () => ({
  EntidadesTab: () => <div>Conteúdo de entidades</div>,
}));
jest.mock("@/components/pages/perfil/timeline-tab", () => ({
  TimelineTab: () => <div>Conteúdo da linha do tempo</div>,
}));
jest.mock("@/components/shared/photo-crop-dialog", () => ({ PhotoCropDialog: () => null }));

const mockUseUsuarioBySlug = jest.mocked(useUsuarioBySlug);
const mockUseCurrentUser = jest.mocked(useCurrentUser);
const mockUseMemberships = jest.mocked(useUserMemberships);
const mockUseUploadPhoto = jest.mocked(useUploadPhoto);
const mockUseDeletePhoto = jest.mocked(useDeletePhoto);

const profile = {
  id: "user-1",
  nome: "Ralf Ferreira",
  slug: "ralf-ferreira",
  eFacade: false,
  urlFotoPerfil: null,
  centro: { id: "center-1", nome: "Centro de Informática", sigla: "CI" },
  curso: { id: "course-1", nome: "Engenharia da Computação" },
};

const currentUser = {
  ...profile,
  email: "student@example.com",
  papelPlataforma: "USER" as const,
  eVerificado: true,
  permissoes: ["sigaa:beta"],
};

function arrange(options?: { ownProfile?: boolean; beta?: boolean }) {
  const ownProfile = options?.ownProfile ?? true;
  const beta = options?.beta ?? true;

  mockUseUsuarioBySlug.mockReturnValue({
    data: profile,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useUsuarioBySlug>);
  mockUseCurrentUser.mockReturnValue({
    data: {
      ...currentUser,
      id: ownProfile ? profile.id : "other-user",
      permissoes: beta ? ["sigaa:beta"] : [],
    },
    isLoading: false,
  } as ReturnType<typeof useCurrentUser>);
  mockUseMemberships.mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useUserMemberships>);
  mockUseUploadPhoto.mockReturnValue({
    isPending: false,
    mutateAsync: jest.fn(),
  } as unknown as ReturnType<typeof useUploadPhoto>);
  mockUseDeletePhoto.mockReturnValue({
    isPending: false,
    mutateAsync: jest.fn(),
  } as unknown as ReturnType<typeof useDeletePhoto>);
}

describe("UsuarioProfileClient academic tab", () => {
  it("coloca dados acadêmicos primeiro e selecionado no perfil próprio com beta", () => {
    arrange();

    render(<UsuarioProfileClient slug="ralf-ferreira" />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs.map(tab => tab.textContent)).toEqual([
      "Dados acadêmicos",
      "Projetos",
      "Entidades",
      "Linha do Tempo",
    ]);
    expect(screen.getByRole("tab", { name: "Dados acadêmicos" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Hub acadêmico")).toBeVisible();
  });

  it("mantém as três abas e Projetos como padrão sem a permissão beta", () => {
    arrange({ beta: false });

    render(<UsuarioProfileClient slug="ralf-ferreira" />);

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Dados acadêmicos" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projetos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Meus Projetos")).toBeVisible();
  });

  it("não expõe dados acadêmicos ao visitar outro perfil", () => {
    arrange({ ownProfile: false });

    render(<UsuarioProfileClient slug="ralf-ferreira" />);

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Dados acadêmicos" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projetos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Hub acadêmico")).not.toBeInTheDocument();
  });
});
