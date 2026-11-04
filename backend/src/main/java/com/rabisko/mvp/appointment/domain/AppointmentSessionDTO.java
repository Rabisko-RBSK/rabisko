package com.rabisko.mvp.appointment.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AppointmentSessionDTO(
    UUID sessionId,
    LocalDate data,
    LocalTime horario,
    int duracaoMinutos,
    Integer posicao,
    String status,
    /** Futura e não marcada: o tatuador pode alterar ou remover. */
    boolean editavel
) {}
