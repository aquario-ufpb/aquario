BEGIN;

CREATE TEMPORARY TABLE "_SigaaCourseChangeReversalBaseline" ON COMMIT DROP AS
SELECT
    COUNT(*) AS "runCount",
    MD5(COALESCE(JSONB_AGG("id" ORDER BY "id")::TEXT, '[]')) AS "runFingerprint"
FROM "SigaaSyncRun";

ALTER TABLE "SigaaSyncRun"
DROP CONSTRAINT "SigaaSyncRun_confirmationProposalId_fkey";

DROP TABLE "SigaaCourseChangeProposal";

ALTER TABLE "SigaaSyncRun"
DROP COLUMN "confirmationProposalId";

DROP TYPE "SigaaCourseChangeProposalState";

DO $$
DECLARE
    baseline RECORD;
    current_count BIGINT;
    current_fingerprint TEXT;
    deleted_migration_count BIGINT;
BEGIN
    SELECT * INTO STRICT baseline FROM "_SigaaCourseChangeReversalBaseline";
    SELECT
        COUNT(*),
        MD5(COALESCE(JSONB_AGG("id" ORDER BY "id")::TEXT, '[]'))
    INTO current_count, current_fingerprint
    FROM "SigaaSyncRun";

    IF current_count <> baseline."runCount"
        OR current_fingerprint <> baseline."runFingerprint" THEN
        RAISE EXCEPTION 'SIGAA course-change reversal changed pre-existing sync runs';
    END IF;

    IF TO_REGCLASS('"SigaaCourseChangeProposal"') IS NOT NULL THEN
        RAISE EXCEPTION 'SIGAA course-change reversal left its proposal table behind';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE "table_schema" = 'public'
          AND "table_name" = 'SigaaSyncRun'
          AND "column_name" = 'confirmationProposalId'
    ) THEN
        RAISE EXCEPTION 'SIGAA course-change reversal left its run column behind';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM PG_TYPE
        WHERE "typname" = 'SigaaCourseChangeProposalState'
    ) THEN
        RAISE EXCEPTION 'SIGAA course-change reversal left its enum type behind';
    END IF;

    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20260822120000_add_sigaa_course_change_proposals';
    GET DIAGNOSTICS deleted_migration_count = ROW_COUNT;

    IF deleted_migration_count <> 1 THEN
        RAISE EXCEPTION 'SIGAA course-change reversal expected one exact migration history record, deleted %',
            deleted_migration_count;
    END IF;
END $$;

COMMIT;
