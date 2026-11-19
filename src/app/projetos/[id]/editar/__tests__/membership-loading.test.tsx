import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditarProjetoPage from "../page";

const mockPush = jest.fn();
const mockUser = { id: "student", papelPlataforma: "USER", nome: "Estudante" };
const mockEntity = { id: "entity", nome: "Grupo de estudo", urlFoto: null };
const mockProject = {
  titulo: "Projeto da entidade",
  status: "PUBLICADO",
  autores: [{ entidadeId: mockEntity.id, entidade: mockEntity, autorPrincipal: true }],
};
const mockMemberships = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: "projeto" }),
}));
jest.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ isLoading: false }) }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({
  useCurrentUser: () => ({ data: mockUser, isLoading: false }),
  useMyMemberships: () => mockMemberships(),
}));
jest.mock("@/lib/client/hooks/use-projetos", () => ({
  useProjetoBySlug: () => ({ data: mockProject, isLoading: false }),
}));
jest.mock("@/components/shared/tiptap", () => () => null);
jest.mock("@/components/shared/co-autores-picker", () => ({ CoAutoresPicker: () => null }));

it.each([true, false])("waits for memberships before deciding access (admin: %s)", isAdmin => {
  const client = new QueryClient();
  const page = () => (
    <QueryClientProvider client={client}>
      <EditarProjetoPage />
    </QueryClientProvider>
  );
  mockPush.mockClear();
  mockMemberships.mockReturnValue({ isLoading: true });
  const { rerender } = render(page());
  expect(screen.getByText("Carregando...")).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();

  mockMemberships.mockReturnValue({
    isLoading: false,
    data: isAdmin ? [{ papel: "ADMIN", entidade: mockEntity }] : [],
  });
  rerender(page());
  if (isAdmin) {
    expect(screen.getByRole("heading", { name: "Editar Projeto" })).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  } else {
    expect(mockPush).toHaveBeenCalledWith("/projetos/projeto");
  }
});
