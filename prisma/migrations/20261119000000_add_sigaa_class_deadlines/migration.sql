ALTER TABLE "SigaaAcademicSnapshot" ADD COLUMN "classDeadlines" JSONB;

-- Older application versions replace the payload without writing classDeadlines.
CREATE FUNCTION clear_stale_sigaa_class_deadlines() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW."classDeadlines" := NULL;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "SigaaAcademicSnapshot_clear_stale_class_deadlines"
BEFORE UPDATE OF "payload" ON "SigaaAcademicSnapshot"
FOR EACH ROW
WHEN (NEW."classDeadlines" IS NOT NULL AND
      NEW."classDeadlines"->>'runId' IS DISTINCT FROM NEW."installedByRunId")
EXECUTE FUNCTION clear_stale_sigaa_class_deadlines();
