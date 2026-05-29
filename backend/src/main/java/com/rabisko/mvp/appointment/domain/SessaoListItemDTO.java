package com.rabisko.mvp.appointment.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record SessaoListItemDTO(
    UUID sessionId,
    UUID appointmentId,
    LocalDate data,
    LocalTime horario,
    int duracaoMinutos,
    String outroNome,
    String outroFotoUrl,
    BigDecimal valorTotal,
    String status
) {}
