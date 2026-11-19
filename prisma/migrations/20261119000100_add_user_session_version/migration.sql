ALTER TABLE "Usuario" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Legacy refreshes did not retain the original login time. Require a fresh login
-- for accounts with a recorded password reset, even if the JWT was refreshed later.
UPDATE "Usuario" u
SET "sessionVersion" = 1
WHERE EXISTS (
    SELECT 1 FROM "TokenVerificacao" t
    WHERE t."usuarioId" = u.id AND t.tipo = 'RESET_SENHA' AND t."usadoEm" IS NOT NULL
);
