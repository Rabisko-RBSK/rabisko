package com.rabisko.mvp.appointment.domain;

import java.time.LocalTime;

public record BusySlotDTO(LocalTime horario, int duracaoMinutos) {}
