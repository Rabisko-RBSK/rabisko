package com.rabisko.mvp.artist.domain;

import java.math.BigDecimal;

public record ArtistDashboardDTO(
    long chatsAbertos,
    BigDecimal valorTotalMes,
    long totalAgendamentosMes,
    /** valorTotalMes / totalAgendamentosMes; null quando nao ha servicos no mes. */
    BigDecimal valorMedioServicoMes
) {}
