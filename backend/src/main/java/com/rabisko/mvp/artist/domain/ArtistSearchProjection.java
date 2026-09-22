package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public interface ArtistSearchProjection {
    UUID getTatuadorId();
    String getNome();
    String getEmail();
    String getEndereco();
}
