ALTER TABLE servicos
    ADD COLUMN IF NOT EXISTS status reserva_status NOT NULL DEFAULT 'confirmada';

CREATE INDEX IF NOT EXISTS idx_reservas_tatuador_data
    ON reservas(tatuador_id, data_sessao);

CREATE INDEX IF NOT EXISTS idx_servicos_tatuador_status
    ON servicos(tatuador_id, status);
