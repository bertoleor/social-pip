-- ai_evals — evals mínimos de IA (ticket t_4f143f7b, Propuesta 3 de
-- docs/audits/ia-propuesta-2026-09-14.md). SQLite local, idempotente.
--
-- Down/rollback (manual): DROP TABLE ai_evals;  DROP INDEX idx_ai_evals_sector_fecha;

CREATE TABLE IF NOT EXISTS ai_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,              -- ISO date YYYY-MM-DD
    sector TEXT NOT NULL,             -- inmobiliario, gastronomia, moda, belleza, fitness, tecnologia
    plataforma TEXT NOT NULL,         -- instagram, tiktok, threads, telegram, whatsapp, ...
    prompt_id TEXT NOT NULL,          -- id/version del prompt canonico usado
    output TEXT NOT NULL,             -- caption/copy generado
    brand_check INTEGER NOT NULL CHECK (brand_check IN (0, 1)),  -- pasó el Brand Rules Validator
    like_humano INTEGER CHECK (like_humano IN (0, 1))            -- NULL hasta revisión humana
);

CREATE INDEX IF NOT EXISTS idx_ai_evals_sector_fecha ON ai_evals (sector, fecha);
