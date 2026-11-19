CREATE TABLE "MediaUpload" (
    "id" UUID PRIMARY KEY,
    "url" TEXT NOT NULL UNIQUE,
    "uploaderId" TEXT NOT NULL,
    "referenceCount" INTEGER NOT NULL DEFAULT 0 CHECK ("referenceCount" >= 0),
    "retired" BOOLEAN NOT NULL DEFAULT false,
    CHECK (NOT "retired" OR "referenceCount" = 0)
);

ALTER TABLE "Projeto" ADD COLUMN "markdownMediaUrls" TEXT[] NOT NULL DEFAULT '{}';

-- Markdown destinations are resolved by the same CommonMark/GFM parser used
-- on the project page. Each row counts at most once for a registered URL.
CREATE FUNCTION aquario_media_ids(fields jsonb) RETURNS uuid[]
LANGUAGE sql STABLE AS $$
    SELECT ARRAY(
        SELECT media."id" FROM "MediaUpload" media WHERE media."url" IN (
            SELECT split_part(split_part(destination, '#', 1), '?', 1)
            FROM jsonb_array_elements_text(
                jsonb_build_array(fields->>'urlImagem', fields->>'urlRepositorio',
                    fields->>'urlDemo', fields->>'urlOutro', fields->>'urlFotoPerfil', fields->>'urlFoto')
                || coalesce(fields->'markdownMediaUrls', '[]')
            ) AS destination
        )
    )
$$;

-- Reference changes and retirement contend on the same media row. A write
-- after retirement fails the table constraint before publishing a broken URL.
CREATE FUNCTION aquario_count_media_references() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    old_ids uuid[] := '{}';
    new_ids uuid[] := '{}';
    media_id uuid;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        old_ids := aquario_media_ids(to_jsonb(OLD));
    END IF;
    IF TG_OP <> 'DELETE' THEN
        new_ids := aquario_media_ids(to_jsonb(NEW));
    END IF;
    FOR media_id IN SELECT DISTINCT id FROM unnest(old_ids || new_ids) AS id ORDER BY id LOOP
        IF (media_id = ANY(old_ids)) <> (media_id = ANY(new_ids)) THEN
            UPDATE "MediaUpload"
            SET "referenceCount" = "referenceCount" + CASE WHEN media_id = ANY(new_ids) THEN 1 ELSE -1 END
            WHERE "id" = media_id;
        END IF;
    END LOOP;
    RETURN NULL;
END
$$;

CREATE TRIGGER usuario_media_references
AFTER INSERT OR UPDATE OF "urlFotoPerfil" OR DELETE ON "Usuario"
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references();
CREATE TRIGGER projeto_media_references
AFTER INSERT OR UPDATE OF "urlImagem", "urlRepositorio", "urlDemo", "urlOutro", "markdownMediaUrls" OR DELETE ON "Projeto"
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references();
CREATE TRIGGER entidade_media_references
AFTER INSERT OR UPDATE OF "urlFoto" OR DELETE ON "Entidade"
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references();

-- Keep physical deletion unavailable on databases initialized with only
-- "prisma db push", where the reference-counting triggers are absent.
CREATE FUNCTION aquario_retire_owned_image(image_url text, owner_id text) RETURNS boolean
LANGUAGE sql AS $$
    WITH retired AS (
        UPDATE "MediaUpload" SET "retired" = true
        WHERE "url" = image_url AND "uploaderId" = owner_id AND "referenceCount" = 0
        RETURNING 1
    )
    SELECT EXISTS (SELECT FROM retired)
$$;
