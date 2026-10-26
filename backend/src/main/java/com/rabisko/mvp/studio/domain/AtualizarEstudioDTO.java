package com.rabisko.mvp.studio.domain;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Corpo do PATCH /studio/me. */
public record AtualizarEstudioDTO(
        @NotNull
        @Min(value = 1, message = "O estudio precisa de ao menos 1 posicao")
        @Max(value = 50, message = "O estudio pode ter no maximo 50 posicoes")
        Integer posicoes
) {}
