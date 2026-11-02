package com.rabisko.mvp.kanban.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Card somente leitura do Kanban de serviços. Os campos de data dependem da
 * coluna: `ultimaMensagemEm` em chat_iniciado, `proximaSessao` em agendado e
 * em_progresso, `concluidoEm` em finalizado. `servicoId` é null em chat_iniciado.
 */
public record KanbanCardDTO(
    KanbanColuna coluna,
    UUID chatId,
    UUID servicoId,
    String clienteNome,
    UUID tatuadorId,
    String tatuadorNome,
    int totalSessoes,
    /** Posição (1..totalSessoes) da próxima sessão; null fora de agendado/em_progresso. */
    Integer sessaoAtual,
    LocalDateTime proximaSessao,
    LocalDate concluidoEm,
    OffsetDateTime ultimaMensagemEm
) {}
