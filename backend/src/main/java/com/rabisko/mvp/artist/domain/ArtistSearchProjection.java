package com.rabisko.mvp.artist.domain;

import java.math.BigDecimal;
import java.util.UUID;

public interface ArtistSearchProjection {
    UUID getTatuadorId();
    String getNome();
    String getEmail();
    String getEndereco();
    String getFotoPerfilUrl();
    BigDecimal getNotaMedia();
    Long getTotalAvaliacoes();
    String[] getEstilos();
}

