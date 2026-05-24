package com.rabisko.mvp.domain.artist;

import java.util.UUID;

// =====================================================================
// DTO ArtistSearchResultDTO — resposta do GET /artist/search.
//
// Lista plana com o MINIMO pra mostrar um item de resultado de busca:
//   - tatuadorId : pra navegar pro perfil
//   - nome/email : vem do `users` via JOIN
//   - endereco   : vem do `tatuadores`
//
// E construido a partir de uma projecao (ArtistSearchProjection) em vez
// da entity, pra evitar carregar a relacao M:N de estilos (LAZY) que
// causaria N consultas extras (problema "N+1").
// =====================================================================
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
