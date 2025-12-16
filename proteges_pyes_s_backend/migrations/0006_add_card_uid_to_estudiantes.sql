ALTER TABLE estudiantes ADD COLUMN card_uid TEXT;
CREATE INDEX idx_estudiantes_card_uid ON estudiantes(card_uid);
