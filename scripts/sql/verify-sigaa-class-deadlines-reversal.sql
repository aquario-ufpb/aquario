BEGIN;

DROP TRIGGER "SigaaAcademicSnapshot_clear_stale_class_deadlines" ON "SigaaAcademicSnapshot";
DROP FUNCTION clear_stale_sigaa_class_deadlines();
ALTER TABLE "SigaaAcademicSnapshot" DROP COLUMN "classDeadlines";
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20261119000000_add_sigaa_class_deadlines';

COMMIT;
