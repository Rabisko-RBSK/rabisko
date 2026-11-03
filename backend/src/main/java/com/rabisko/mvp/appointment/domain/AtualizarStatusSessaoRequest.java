package com.rabisko.mvp.appointment.domain;

import jakarta.validation.constraints.NotNull;

public record AtualizarStatusSessaoRequest(@NotNull AppointmentStatus status) {}

