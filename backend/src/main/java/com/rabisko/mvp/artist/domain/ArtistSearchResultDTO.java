package com.rabisko.mvp.artist.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record ArtistSearchResultDTO(
        UUID tatuadorId,
        String nome,
        String email,
        String endereco,
        String fotoPerfilUrl,
        BigDecimal notaMedia,
        long totalAvaliacoes,
        String[] estilos
) {
    public static ArtistSearchResultDTO fromProjection(ArtistSearchProjection p) {
        return new ArtistSearchResultDTO(
                p.getTatuadorId(),
                p.getNome(),
                p.getEmail(),
                p.getEndereco(),
                p.getFotoPerfilUrl(),
                p.getNotaMedia(),
                p.getTotalAvaliacoes() != null ? p.getTotalAvaliacoes() : 0,
                p.getEstilos()
        );
    }
}
