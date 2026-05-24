package com.rabisko.mvp.domain.appointment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AppointmentDTO(
    UUID appointmentId,
    UUID chatId,
    UUID clienteId,
    UUID tatuadorId,
    String status,
    BigDecimal valorTotal,
    List<AppointmentSessionDTO> sessoes,
    LocalDateTime dataCriacao
) {}
