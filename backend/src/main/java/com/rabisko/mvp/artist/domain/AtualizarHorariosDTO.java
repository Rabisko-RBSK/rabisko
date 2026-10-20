package com.rabisko.mvp.artist.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Corpo do PUT /artist/me/horarios: a semana inteira (so os dias abertos). */
public record AtualizarHorariosDTO(
        @NotEmpty(message = "Informe ao menos um dia de atendimento")
        @Valid
        List<HorarioDiaDTO> horarios
) {}
