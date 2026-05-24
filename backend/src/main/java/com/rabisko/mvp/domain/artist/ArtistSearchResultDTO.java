package com.rabisko.mvp.domain.artist;

import java.util.UUID;

/**
 * RESPONSE DTO da busca de tatuadores (GET /artist/search). Lista plana com
 * o minimo pra exibir no resultado: id (pra navegar), nome/email (vindos do
 * users via JOIN) e endereco (texto livre em `tatuadores`).
 *
 * Construido a partir de uma projecao nativa (ArtistSearchProjection) pra
 * evitar carregar a entity inteira + relacoes (estilos LAZY explodiria N+1).
 */
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
