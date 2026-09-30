package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public record PortfolioImagemDTO(
        UUID imagemId,
        String url
) {
    public static PortfolioImagemDTO fromEntity(PortfolioImagem img) {
        return new PortfolioImagemDTO(
                img.getImagemId(),
                img.getUrl()
        );
    }
}
