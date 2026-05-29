package com.rabisko.mvp.artist.domain;

import java.util.UUID;

// =====================================================================
// DTO PortfolioImagemDTO — formato de resposta da imagem do portfolio.
//
// Mantem em sync com a interface `PortfolioImage` do mobile
// (mobile/src/services/api/artistService.ts).
// =====================================================================
public record PortfolioImagemDTO(
        UUID imagemId,
        String url,
        String descricao,
        Integer ordem
) {
    public static PortfolioImagemDTO fromEntity(PortfolioImagem img) {
        return new PortfolioImagemDTO(
                img.getImagemId(),
                img.getUrl(),
                img.getDescricao(),
                img.getOrdem()
        );
    }
}
