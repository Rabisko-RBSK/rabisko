package com.rabisko.mvp.studio.domain;

import java.math.BigDecimal;
import java.util.UUID;

/** Estúdio na busca do cliente (lista única com os tatuadores). */
public record StudioSearchResultDTO(
        UUID estudioId,
        String nome,
        String endereco,
        String fotoPerfilUrl,
        BigDecimal notaMedia,
        long totalAvaliacoes,
        long totalTatuadores,
        String[] estilos
) {
    public static StudioSearchResultDTO fromProjection(StudioSearchProjection p) {
        return new StudioSearchResultDTO(
                p.getEstudioId(),
                p.getNome(),
                p.getEndereco(),
                p.getFotoPerfilUrl(),
                p.getNotaMedia(),
                p.getTotalAvaliacoes() != null ? p.getTotalAvaliacoes() : 0,
                p.getTotalTatuadores() != null ? p.getTotalTatuadores() : 0,
                p.getEstilos()
        );
    }
}
