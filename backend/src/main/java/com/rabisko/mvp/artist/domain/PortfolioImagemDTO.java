package com.rabisko.mvp.artist.domain;

import java.util.UUID;

public record PortfolioImagemDTO(
        UUID imagemId,
        String url,
        UUID estiloId
) {
    public static PortfolioImagemDTO fromEntity(Portfolio img) {
        return new PortfolioImagemDTO(
                img.getImagemId(),
                img.getUrl(),
                img.getEstiloId()
        );
    }
}
