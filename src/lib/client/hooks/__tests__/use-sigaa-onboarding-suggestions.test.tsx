import { renderHook } from "@testing-library/react";

import { useSigaaOnboardingSuggestions } from "../use-sigaa-onboarding-suggestions";
import { useOwnSigaaAcademicState } from "../use-sigaa";
import { useDisciplinasConcluidas } from "../use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "../use-disciplinas-semestre";

jest.mock("../use-sigaa", () => ({ useOwnSigaaAcademicState: jest.fn() }));
jest.mock("../use-disciplinas-concluidas", () => ({ useDisciplinasConcluidas: jest.fn() }));
jest.mock("../use-disciplinas-semestre", () => ({ useDisciplinasSemestreAtivo: jest.fn() }));

const sigaaHook = jest.mocked(useOwnSigaaAcademicState);
const completedHook = jest.mocked(useDisciplinasConcluidas);
const enrolledHook = jest.mocked(useDisciplinasSemestreAtivo);

describe("useSigaaOnboardingSuggestions query gates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    completedHook.mockReturnValue({ data: undefined, isLoading: false } as ReturnType<
      typeof useDisciplinasConcluidas
    >);
    enrolledHook.mockReturnValue({ data: undefined, isLoading: false } as ReturnType<
      typeof useDisciplinasSemestreAtivo
    >);
  });

  it("does not load manual state without a beta snapshot", () => {
    sigaaHook.mockReturnValue({ data: { snapshot: null }, isLoading: false } as ReturnType<
      typeof useOwnSigaaAcademicState
    >);

    renderHook(() => useSigaaOnboardingSuggestions(undefined, null, true));

    expect(completedHook).toHaveBeenCalledWith(false);
    expect(enrolledHook).toHaveBeenCalledWith(false);
  });

  it("loads manual state only after a beta snapshot exists", () => {
    sigaaHook.mockReturnValue({
      data: { snapshot: { payload: {} } },
      isLoading: false,
    } as ReturnType<typeof useOwnSigaaAcademicState>);

    renderHook(() => useSigaaOnboardingSuggestions(undefined, null, true));

    expect(completedHook).toHaveBeenCalledWith(true);
    expect(enrolledHook).toHaveBeenCalledWith(true);
  });
});
