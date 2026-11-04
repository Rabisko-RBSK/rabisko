package com.rabisko.mvp.appointment.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

/**
 * Corpo do PUT /appointments/{id}. `sessoes` é o conjunto desejado das
 * sessões editáveis (futuras e não marcadas): as que ficarem de fora são
 * canceladas. Sessões travadas não entram aqui e não mudam.
 */
public record EditarServicoRequest(
    @NotNull @Positive BigDecimal valorTotal,
    @NotNull @Valid List<SessaoEditada> sessoes
) {}
