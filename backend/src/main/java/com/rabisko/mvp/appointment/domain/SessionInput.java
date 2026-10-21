package com.rabisko.mvp.appointment.domain;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * @param posicao posição do estúdio (1..posicoes). Obrigatória quando o
 *                tatuador é vinculado a um estúdio; ignorada caso contrário.
 */
public record SessionInput(
    @NotNull @FutureOrPresent LocalDate data,
    @NotNull LocalTime horario,
    @Positive int duracaoMinutos,
    @Positive Integer posicao
) {}
