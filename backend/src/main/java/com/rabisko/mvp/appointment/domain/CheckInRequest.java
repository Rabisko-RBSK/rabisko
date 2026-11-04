package com.rabisko.mvp.appointment.domain;

import jakarta.validation.constraints.NotBlank;

public record CheckInRequest(@NotBlank String token) {}

