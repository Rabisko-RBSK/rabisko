package com.rabisko.mvp.domain.appointment;

import java.time.LocalTime;

public record BusySlotDTO(LocalTime horario, int duracaoMinutos) {}
