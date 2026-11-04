package com.rabisko.mvp.appointment.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Serviço com as sessões não canceladas, em ordem de data. */
public record AppointmentDTO(
    UUID appointmentId,
    UUID chatId,
    UUID clienteId,
    UUID tatuadorId,
    String clienteNome,
    String status,
    boolean finalizado,
    BigDecimal valorTotal,
    List<AppointmentSessionDTO> sessoes,
    LocalDateTime dataCriacao
) {}
