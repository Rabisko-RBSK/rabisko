package com.rabisko.mvp.domain.artist;

import java.math.BigDecimal;

public record ArtistDashboardDTO(
    long chatsAbertos,
    BigDecimal valorTotalMes,
    long totalAgendamentosMes
) {}
