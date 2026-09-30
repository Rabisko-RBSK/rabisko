package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public record ArtistStudioSearchResultDTO(
        UUID tatuadorId,
        String nome,
        String instagram,
        String fotoPerfilUrl
) {
    public static ArtistStudioSearchResultDTO fromProjection(ArtistStudioSearch p) {
        return new ArtistStudioSearchResultDTO(
                p.getTatuadorId(),
                p.getNome(),
                p.getInstagram(),
                p.getFotoPerfilUrl()
        );
    }
}

