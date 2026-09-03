BEGIN;

UPDATE "Usuario"
SET
  "matricula" = CASE
    WHEN "matriculaOrigem" = 'SIGAA'::"MatriculaOrigem" THEN NULL
    ELSE "matricula"
  END,
  "matriculaOrigem" = CASE
    WHEN "matriculaOrigem" = 'SIGAA'::"MatriculaOrigem" THEN NULL
    ELSE "matriculaOrigem"
  END,
  "matriculaVerificadaPeloSigaaEm" = NULL
WHERE "matriculaOrigem" = 'SIGAA'::"MatriculaOrigem"
   OR "matriculaVerificadaPeloSigaaEm" IS NOT NULL;

DELETE FROM "SigaaConnection";
DELETE FROM "SigaaRateLimitBucket";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "SigaaConnection")
    OR EXISTS (SELECT 1 FROM "SigaaAcademicSnapshot")
    OR EXISTS (SELECT 1 FROM "SigaaSyncRun")
    OR EXISTS (SELECT 1 FROM "SigaaRateLimitBucket")
    OR EXISTS (
      SELECT 1
      FROM "Usuario"
      WHERE "matriculaOrigem" = 'SIGAA'::"MatriculaOrigem"
         OR "matriculaVerificadaPeloSigaaEm" IS NOT NULL
    )
  THEN
    RAISE EXCEPTION 'staging SIGAA data purge did not reach zero';
  END IF;
END $$;

COMMIT;
