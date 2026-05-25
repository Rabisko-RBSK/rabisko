package com.rabisko.mvp.appointment.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateAppointmentRequest(
    @NotNull UUID chatId,
    @NotEmpty @Valid List<SessionInput> sessoes,
    @NotNull @Positive BigDecimal valorTotal
) {}
