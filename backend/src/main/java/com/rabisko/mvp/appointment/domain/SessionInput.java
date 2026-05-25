package com.rabisko.mvp.appointment.domain;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalTime;

public record SessionInput(
    @NotNull @FutureOrPresent LocalDate data,
    @NotNull LocalTime horario,
    @Positive int duracaoMinutos
) {}
