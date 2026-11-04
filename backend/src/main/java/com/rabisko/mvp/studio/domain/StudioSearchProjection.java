package com.rabisko.mvp.studio.domain;

import java.math.BigDecimal;
import java.util.UUID;

public interface StudioSearchProjection {
    UUID getEstudioId();
    String getNome();
    String getEndereco();
    String getFotoPerfilUrl();
    BigDecimal getNotaMedia();
    Long getTotalAvaliacoes();
    Long getTotalTatuadores();
    String[] getEstilos();
}
