package com.rabisko.mvp.kanban.domain;

import com.rabisko.mvp.appointment.domain.SessaoListItemDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Card somente leitura do Kanban de serviços. Os campos de data dependem da
 * coluna: `naoLidas`, `aguardandoDesde` e `ultimaMensagemEm` em
 * mensagens_nao_lidas, `proximaSessao` em agendado e em_progresso,
 * `concluidoEm` em finalizado. `servicoId` é null em mensagens_nao_lidas.
 *
 * Ações do app ao tocar no card: em mensagens_nao_lidas, o tatuador abre o
 * chat (`chatId` + `clienteAuthId`); nos demais, abre os detalhes de `sessao`
 * — a próxima (ou em andamento) em agendado/em_progresso, a última em finalizado.
 */
public record KanbanCardDTO(
    KanbanColuna coluna,
    UUID chatId,
    UUID servicoId,
    String clienteNome,
    /** auth.users.id do cliente — o chat usa para separar as mensagens de cada lado. */
    UUID clienteAuthId,
    UUID tatuadorId,
    String tatuadorNome,
    int totalSessoes,
    /** Posição (1..totalSessoes) da próxima sessão; null fora de agendado/em_progresso. */
    Integer sessaoAtual,
    LocalDateTime proximaSessao,
    LocalDate concluidoEm,
    /** Mensagens do cliente que o tatuador ainda não leu. */
    Integer naoLidas,
    /** Envio da mais antiga não lida — desde quando o cliente espera resposta. */
    OffsetDateTime aguardandoDesde,
    OffsetDateTime ultimaMensagemEm,
    /** Sessão aberta ao tocar no card (mesmo formato do Gantt); null sem sessão ou em mensagens_nao_lidas. */
    SessaoListItemDTO sessao
) {}
