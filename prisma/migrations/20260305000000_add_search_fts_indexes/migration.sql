-- Enable unaccent extension for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Immutable wrapper for unaccent (required for GIN index expressions)
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- GIN indexes for Full-Text Search
CREATE INDEX idx_guias_fts ON "Guia"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_entidades_fts ON "Entidade"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_vagas_fts ON "Vaga"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))));

CREATE INDEX idx_disciplinas_fts ON "Disciplina"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, ''))));

CREATE INDEX idx_cursos_fts ON "Curso"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome)));

CREATE INDEX idx_usuarios_fts ON "Usuario"
  USING GIN (to_tsvector('portuguese', immutable_unaccent(nome)));
