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
        UUID estudioId,
        String nomeEstudio,
        String fotoEstudioUrl,
        List<PortfolioImagemDTO> portfolio
) {}

