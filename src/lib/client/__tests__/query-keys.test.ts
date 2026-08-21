import { privateQueryKeys, queryKeys } from "@/lib/client/query-keys";

describe("private query keys", () => {
  const privateKeys = [
    queryKeys.usuarios.current("user-1"),
    queryKeys.usuarios.currentMemberships("user-1"),
    queryKeys.usuarios.onboarding("user-1"),
    queryKeys.disciplinasConcluidas.me("user-1"),
    queryKeys.disciplinasSemestre.ativo("user-1"),
  ];

  it.each(privateKeys.map(key => [key]))("scopes %p to the authenticated user", key => {
    expect(key).toEqual(expect.arrayContaining(privateQueryKeys.byUser("user-1")));
  });

  it("does not reuse a private cache key across identities", () => {
    expect(queryKeys.usuarios.current("user-1")).not.toEqual(queryKeys.usuarios.current("user-2"));
    expect(queryKeys.disciplinasConcluidas.me("user-1")).not.toEqual(
      queryKeys.disciplinasConcluidas.me("user-2")
    );
  });
});
