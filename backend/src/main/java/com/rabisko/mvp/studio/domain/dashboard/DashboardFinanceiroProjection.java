package com.rabisko.mvp.studio.domain.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public interface DashboardFinanceiroProjection {
    UUID getContratoId();
    UUID getTatuadorId();
    String getNome();
    String getModelo();
    BigDecimal getPercentualEstudio();
    BigDecimal getValorFixo();
    String getPeriodicidade();
    LocalDate getInicio();
    LocalDate getFim();
    Integer getDias();
    Long getSessoes();
    BigDecimal getValorSessoes();

    @JsonProperty("aReceber")
    BigDecimal getAReceber();
    
    @JsonProperty("aPagar")
    BigDecimal getAPagar();
}

