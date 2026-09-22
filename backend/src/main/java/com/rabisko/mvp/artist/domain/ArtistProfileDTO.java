package com.rabisko.mvp.artist.domain;

import java.util.List;
import java.util.UUID;

public record ArtistProfileDTO(
        UUID tatuadorId,
        String nome,
        String fotoUrl,
        String bio,
        String instagram,
        String tier,
        List<PortfolioImagemDTO> portfolio
) {}
