package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public record ArtistSearchResultDTO(
        UUID tatuadorId,
        String nome,
        String email,
        String endereco
) {
    public static ArtistSearchResultDTO fromProjection(ArtistSearchProjection p) {
        return new ArtistSearchResultDTO(
                p.getTatuadorId(),
                p.getNome(),
                p.getEmail(),
                p.getEndereco()
        );
    }
}
