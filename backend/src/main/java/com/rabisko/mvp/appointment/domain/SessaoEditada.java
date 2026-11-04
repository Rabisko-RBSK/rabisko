package com.rabisko.mvp.appointment.domain;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Sessão no pedido de edição do serviço: com `sessionId`, uma sessão
 * existente (editável) com a data/duração/posição desejadas; sem, uma nova.
 */
public record SessaoEditada(
    UUID sessionId,
    @NotNull LocalDate data,
    @NotNull LocalTime horario,
    @Positive int duracaoMinutos,
    @Positive Integer posicao
) {
    public SessionInput comoEntrada() {
        return new SessionInput(data, horario, duracaoMinutos, posicao);
    }
}
