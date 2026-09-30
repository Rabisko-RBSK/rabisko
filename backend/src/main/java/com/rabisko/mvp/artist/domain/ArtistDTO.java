package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public record ArtistDTO(
    UUID tatuadorId,
    UUID userId,
    UUID estudioId,
    String bio,
    String instagram,
    UUID enderecoId,
    boolean vinculadoEstudio
) {
    /** Conversao Artist -> ArtistDTO (omite campos internos como dataCriacao). */
    public static ArtistDTO from(Artist a) {
        return new ArtistDTO(
            a.getTatuadorId(),
            a.getUserId(),
            a.getEstudioId(),
            a.getBio(),
            a.getInstagram(),
            a.getEnderecoId(),
            a.isVinculadoEstudio()
        );
    }
}
