package com.rabisko.mvp.appointment.domain;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Uma sessão já reservada no estúdio, para o gráfico de posições.
 *
 * @param posicao null em sessões sem posição (anteriores às posições)
 * @param propria true quando a sessão é do tatuador logado
 */
public record ReservaPosicaoDTO(
    Integer posicao,
    LocalDate data,
    LocalTime horario,
    int duracaoMinutos,
    String tatuadorNome,
    boolean propria
) {}
