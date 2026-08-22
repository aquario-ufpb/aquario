BEGIN;

CREATE TEMPORARY TABLE "_SigaaReversalBaseline" ON COMMIT DROP AS
SELECT
    COUNT(*) AS "usuarioCount",
    MD5(
        COALESCE(
            JSONB_AGG(JSONB_BUILD_ARRAY("id", "matricula") ORDER BY "id")::TEXT,
            '[]'
        )
    ) AS "usuarioFingerprint"
FROM "Usuario";

ALTER TABLE "SigaaConnection"
DROP CONSTRAINT "SigaaConnection_usuarioId_leaseRunId_fkey";

ALTER TABLE "SigaaAcademicSnapshot"
DROP CONSTRAINT "SigaaAcademicSnapshot_usuarioId_installedByRunId_fkey";

DROP TABLE "SigaaAcademicSnapshot";
DROP TABLE "SigaaSyncRun";
DROP TABLE "SigaaConnection";
DROP TABLE "SigaaRateLimitBucket";

ALTER TABLE "Usuario"
DROP CONSTRAINT "Usuario_matricula_provenance_check",
DROP COLUMN "matriculaVerificadaPeloSigaaEm",
DROP COLUMN "matriculaOrigem";

DROP TYPE "SigaaRateLimitOperation";
DROP TYPE "SigaaSyncFailureCode";
DROP TYPE "SigaaSyncRunStatus";
DROP TYPE "SigaaConnectionStatus";
DROP TYPE "MatriculaOrigem";

DO $$
DECLARE
    baseline RECORD;
    current_count BIGINT;
    current_fingerprint TEXT;
    deleted_migration_count BIGINT;
BEGIN
    SELECT * INTO STRICT baseline FROM "_SigaaReversalBaseline";
    SELECT
        COUNT(*),
        MD5(
            COALESCE(
                JSONB_AGG(JSONB_BUILD_ARRAY("id", "matricula") ORDER BY "id")::TEXT,
                '[]'
            )
        )
    INTO current_count, current_fingerprint
    FROM "Usuario";

    IF current_count <> baseline."usuarioCount"
        OR current_fingerprint <> baseline."usuarioFingerprint" THEN
        RAISE EXCEPTION 'SIGAA reversal changed pre-existing Usuario identity data';
    END IF;

    IF TO_REGCLASS('"AuditLog"') IS NULL THEN
        RAISE EXCEPTION 'SIGAA reversal removed a pre-existing table';
    END IF;

    IF TO_REGCLASS('"SigaaConnection"') IS NOT NULL
        OR TO_REGCLASS('"SigaaSyncRun"') IS NOT NULL
        OR TO_REGCLASS('"SigaaAcademicSnapshot"') IS NOT NULL
        OR TO_REGCLASS('"SigaaRateLimitBucket"') IS NOT NULL THEN
        RAISE EXCEPTION 'SIGAA reversal left persistence tables behind';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE "table_schema" = 'public'
          AND "table_name" = 'Usuario'
          AND "column_name" IN ('matriculaOrigem', 'matriculaVerificadaPeloSigaaEm')
    ) THEN
        RAISE EXCEPTION 'SIGAA reversal left Usuario columns behind';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM PG_TYPE
        WHERE "typname" IN (
            'MatriculaOrigem',
            'SigaaConnectionStatus',
            'SigaaSyncRunStatus',
            'SigaaSyncFailureCode',
            'SigaaRateLimitOperation'
        )
    ) THEN
        RAISE EXCEPTION 'SIGAA reversal left enum types behind';
    END IF;

    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20260821090000_add_sigaa_persistence';
    GET DIAGNOSTICS deleted_migration_count = ROW_COUNT;

    IF deleted_migration_count <> 1 THEN
        RAISE EXCEPTION 'SIGAA reversal expected one exact migration history record, deleted %',
            deleted_migration_count;
    END IF;
END $$;

COMMIT;
