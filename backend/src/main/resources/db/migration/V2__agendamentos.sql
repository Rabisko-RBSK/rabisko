-- Adiciona coluna de status em `servicos` reutilizando o enum nativo `reserva_status`.
-- As tabelas `servicos` (agendamento pai) e `reservas` (sessões) já existem.
ALTER TABLE servicos
    ADD COLUMN IF NOT EXISTS status reserva_status NOT NULL DEFAULT 'confirmada';

-- Índices para busy-slots e listagem por tatuador/data
CREATE INDEX IF NOT EXISTS idx_reservas_tatuador_data
    ON reservas(tatuador_id, data_sessao);

CREATE INDEX IF NOT EXISTS idx_servicos_tatuador_status
    ON servicos(tatuador_id, status);
