CREATE TABLE "MediaUpload" (
    "id" UUID PRIMARY KEY,
    "url" TEXT NOT NULL UNIQUE,
    "uploaderId" TEXT NOT NULL,
    "referenceCount" INTEGER NOT NULL DEFAULT 0 CHECK ("referenceCount" >= 0),
    "retired" BOOLEAN NOT NULL DEFAULT false,
    CHECK (NOT "retired" OR "referenceCount" = 0)
);

-- The generated marker identifies the same file in a cover, profile, entity
-- photo or rich-text image, including URLs with fragments and query strings.
CREATE FUNCTION aquario_media_ids(content text) RETURNS uuid[]
LANGUAGE sql IMMUTABLE AS $$
    SELECT ARRAY(
        SELECT DISTINCT matches[1]::uuid
        FROM regexp_matches(content, 'aq-media-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', 'g') AS matches
    )
$$;

-- Reference changes and retirement contend on the same media row. A write
-- after retirement fails the table constraint before publishing a broken URL.
CREATE FUNCTION aquario_count_media_references() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    old_ids uuid[] := '{}';
    new_ids uuid[] := '{}';
    old_fields jsonb;
    new_fields jsonb;
    media_id uuid;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        old_fields := to_jsonb(OLD);
        old_ids := aquario_media_ids(concat_ws(' ', old_fields->>TG_ARGV[0], old_fields->>TG_ARGV[1]));
    END IF;
    IF TG_OP <> 'DELETE' THEN
        new_fields := to_jsonb(NEW);
        new_ids := aquario_media_ids(concat_ws(' ', new_fields->>TG_ARGV[0], new_fields->>TG_ARGV[1]));
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
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references('urlFotoPerfil');
CREATE TRIGGER projeto_media_references
AFTER INSERT OR UPDATE OF "urlImagem", "textContent" OR DELETE ON "Projeto"
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references('urlImagem', 'textContent');
CREATE TRIGGER entidade_media_references
AFTER INSERT OR UPDATE OF "urlFoto" OR DELETE ON "Entidade"
FOR EACH ROW EXECUTE FUNCTION aquario_count_media_references('urlFoto');

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
